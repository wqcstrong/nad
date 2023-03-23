import { CodeGen } from './CodeGen';
import type { Root } from '../models/Root';
import type { Route } from '../models/Route';
import { checkSuper, ss, t2s } from '../helpers/ocHelper';
import { isJavaVoid } from '../helpers/javaHelper';

interface Options {
  base: string;
  noHead?: boolean;
}

export class CodeGenForOc extends CodeGen {
  private buildReturnType(a: Route) {
    const t = a.returnType;
    if (t.isGenericVariable || isJavaVoid(t.name)) {
      return t2s(t);
    }
    return `${t2s(t)}*`;
  }
  private buildApiDeclaration(a: Route) {
    const params = a.parameters
      .map((p, i) => {
        let s: string = i ? p.name : '';
        s += `:(${t2s(p.type)}`;
        if (!p.type.isGenericVariable) s += '*';
        s += `)${p.name}`;
        return s;
      })
      .join(' ');
    return `- (${this.buildReturnType(a)})${a.uniqName}${params}`;
  }
  private getModulesIface() {
    const gen = new CodeGen();
    for (const m of this.builder.modules) {
      gen.writeComment(() => {
        gen.write(m.description || m.moduleName);
        gen.write(`@JavaClass ${m.name}`);
      });
      gen.write(`@interface ${m.moduleName} : NSObject`);
      gen.write(`@property (nonatomic, copy) NSString *appId;`);
      for (const a of m.routes) {
        gen.writeComment(() => {
          gen.write(a.description || a.name);
          for (const p of a.parameters) {
            if (p.description) gen.write(`@param ${p.name} ${p.description}`);
          }
        });
        gen.write(`${this.buildApiDeclaration(a)};`);
      }
      gen.write('@end', '');
    }
    return gen;
  }
  private getApiImpl(a: Route) {
    const gen = new CodeGen();
    gen.write(`${this.buildApiDeclaration(a)} {`);
    gen.writeBlock(() => {
      const rt = this.buildReturnType(a);
      gen.write(`NadInvoker *req = [[NadInvoker new] init];`);
      gen.write(`[req initAppId:${ss(this.options.base)} method:${ss(a.method)} path:${ss(a.pattern)}];`);
      if (a.requestContentType) {
        gen.write(`[req addHeader:${ss('Content-Type')} value:${ss(a.requestContentType)}];`);
      }
      for (const p of a.parameters) {
        for (const [m, ...args] of p.actions) {
          if (args.length) {
            gen.write(`[req ${m}:${args.map(ss).join(', ')} value:${p.name}];`);
          } else {
            gen.write(`[req ${m}:${p.name}];`);
          }
        }
      }
      gen.write(`return (${rt})[req invoke];`);
    });
    gen.write('}');
    return gen;
  }
  private getModulesImpl() {
    const gen = new CodeGen();
    for (const m of this.builder.modules) {
      gen.writeComment(() => {
        gen.write(m.description || m.moduleName);
        gen.write(`@JavaClass ${m.name}`);
      });
      gen.write(`@implementation ${m.moduleName}`);
      for (const a of m.routes) {
        gen.write(this.getApiImpl(a));
      }
      gen.write('@end', '');
    }
    return gen;
  }
  private writeEnumDefs() {
    for (const c of this.builder.enumList) {
      this.writeComment(() => {
        this.write(c.description || c.moduleName);
        this.write(`@JavaClass ${c.name}`);
      });
      const enumTypeMapping: Record<string, string> = { string: 'NSString', number: 'NSNumber' };
      const ocType = enumTypeMapping[c.valueType] || 'NSObject';
      this.write(`typedef ${ocType} ${c.moduleName};`);
      for (const v of c.constants) {
        this.write(`const ${c.moduleName} *${c.moduleName}_${v.name} = ${ss(v.value)};`);
        if (v.memo) this.amend((s) => `${s} // ${v.memo}`);
      }
      this.write('');
    }
  }
  private writeDefs() {
    const list = this.builder.declarationList.sort((a, b) => {
      if (checkSuper(a, b)) return 1;
      if (checkSuper(b, a)) return -1;
      return 0;
    });
    for (const c of list) this.write(`@class ${c.defName};`);
    if (list.length) this.write('');
    this.writeEnumDefs();
    for (const c of list) {
      this.writeComment(() => {
        this.write(c.description || c.moduleName);
        this.write(`@JavaClass ${c.name}`);
      });
      let superName = 'NSObject';
      if (c.superclass) superName = t2s(c.superclass);
      this.write(`@interface ${c.defName} : ${superName}`);
      for (const m of c.members) {
        const flags = ['nonatomic'];
        const ocType = t2s(m.type);
        const fieldName = m.name;
        if (ocType === 'NSString') {
          flags.push('copy');
        } else {
          flags.push('assign');
        }
        const star = m.type.isGenericVariable ? '' : '*';
        if (m.description) {
          this.writeComment(() => {
            this.write(m.description);
          });
        }
        this.write(`@property (${flags.join(', ')}) ${ocType} ${star}${fieldName};`);
      }
      this.write('@end');
      this.write('');
    }
  }
  constructor(private builder: Root, private options: Options) {
    super();
    if (!options.noHead) {
      this.write('/**');
      this.write(' * 该文件由 Nad CLI 生成，请勿手改');
      this.write(' * This file is generated by Nad CLI, do not edit manually.');
      this.write(' */');
      this.write('');
    }
    const ifaceGen = this.getModulesIface();
    const implGen = this.getModulesImpl();
    this.write('#import <Foundation/Foundation.h>');
    this.write('');
    this.write('// You should implement this interface in your code.');
    this.write('@interface NadInvoker : NSObject');
    this.write('- (void)initAppId: (NSString*)appId method:(NSString*)method path:(NSString*)path;');
    this.write('- (void)addHeader: (NSString*)name value:(NSString*)value;');
    this.write('- (void)addPathVariable:(NSString*)name value:(NSObject*)value;');
    this.write('- (void)addRequestParam:(NSString*)name value:(NSObject*)value;');
    this.write('- (void)addMultipartFile:(NSString*)name value:(NSObject*)value;');
    this.write('- (void)addRequestBody:(NSObject*)body;');
    this.write('- (void)addModelAttribute:(NSObject*)params;');
    this.write('- (NSObject*)invoke;');
    this.write('@end');
    this.write('');
    this.writeDefs();
    this.write('');
    this.write(ifaceGen);
    this.write('');
    this.write(implGen);
  }
}
