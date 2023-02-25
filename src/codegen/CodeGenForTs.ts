import { CodeGen } from './CodeGen';
import { ss, t2s } from '../helpers/tsHelper';
import type { Root } from '../models/Root';
import type { Route } from '../models/Route';

interface Options {
  base: string;
  /**
   * @default false;
   */
  noHead?: boolean;
  /**
   * @default "@huolala-tech/nad-runtime"
   */
  runtimePkgName?: string;
}

export class CodeGenForTs extends CodeGen {
  /**
   * TS does not allow a required parameter follow an optional parameter, see https://typescript.tv/errors/#TS1016
   * SOLUTION 1: Sort the parameter list, making all required parameters be advanced.
   * This solution breaks uniformity with Java definitions and may lead to confusion among some developers, making it an unfavorable option.
   * SOLUTION 2: Find the last required parameters, make all optional parameters to left of it required, and change their type to `T | null`.
   * Use the SOLUTION 2 here.
   */
  private getPars(a: Route) {
    let hasRequired = false;
    const pars = a.parameters
      .slice(0)
      .reverse()
      .map((p) => {
        if (hasRequired && p.required === '?') return `${p.name}: ${t2s(p.type)} | null`;
        hasRequired = hasRequired || p.required === '';
        return `${p.name}${p.required}: ${t2s(p.type)}`;
      })
      .reverse();
    pars.push('settings?: Partial<Settings>');
    return pars;
  }
  private writeApi(a: Route) {
    const pars = this.getPars(a);
    if (a.description) {
      this.writeComment(() => {
        this.write(a.description);
      });
    }
    this.write(`export const ${a.uniqName} = async (${pars.join(', ')}) => {`);
    this.writeBlock(() => {
      this.write(`return new NadInvoker<${t2s(a.returnType)}>(BASE)`);
      this.writeBlock(() => {
        this.write(`.open(${ss(a.method)}, ${ss(a.pattern)}, settings)`);
        for (const p of a.parameters) {
          for (const [m, ...args] of p.actions) {
            if (args.length) {
              this.write(`.${m}(${args.map(ss).join(', ')}, ${p.name})`);
            } else {
              this.write(`.${m}(${p.name})`);
            }
          }
        }
        this.write(`.execute();`);
      });
    });
    this.write('};');
  }
  private writeModules() {
    for (const m of this.builder.routes) {
      this.writeComment(() => {
        this.write(m.description || m.moduleName);
        this.write(`@iface ${m.name}`);
      });
      this.write(`export namespace ${m.moduleName} {`);
      this.writeBlock(() => {
        for (const a of m.apis) this.writeApi(a);
      });
      this.write('}', '');
    }
  }
  private writeCommonDefs() {
    for (const [alias, tsType] of Object.entries(this.builder.commonDefs)) {
      this.write(`export type ${alias} = ${tsType};`);
      this.write('');
    }
  }
  private writeEnums() {
    for (const e of this.builder.enumList) {
      this.write(`export enum ${e.simpleName} {`);
      this.writeBlock(() => {
        for (const v of e.constants) {
          this.write(`${v.name} = ${ss(v.value)},`);
          if (v.memo) this.amend((s) => `${s} // ${v.memo}`);
        }
      });
      this.write('}');
      this.write('');
    }
  }
  private writeClasses() {
    for (const c of this.builder.declarationList) {
      this.writeComment(() => {
        this.write(c.simpleName);
        this.write(`@iface ${c.name}`);
      });
      let { defName } = c;
      if (c.superclass) {
        const type = t2s(c.superclass);
        if (type !== 'any') defName += ` extends ${type}`;
      }
      this.write(`export interface ${defName} {`);
      this.writeBlock(() => {
        for (const m of c.members) {
          this.write(`${m.name}: ${t2s(m.type)};`);
        }
      });
      this.write('}');
      this.write('');
    }
  }
  constructor(private builder: Root, private options: Options) {
    super();
    if (!options.noHead) {
      this.write('/* 该文件由 Nad CLI 生成，请勿手改 */');
      this.write('/* This file is generated by Nad CLI, do not edit manually. */');
      this.write('/* eslint-disable */');
      this.write('');
    }
    const runtimePkgName = options.runtimePkgName || '@huolala-tech/nad-runtime';
    this.write(`import { NadInvoker } from '${runtimePkgName}';`);
    this.write(`import type { Settings } from '${runtimePkgName}';`);
    this.write('');
    const { base } = this.options;
    this.write(`const BASE = ${ss(base)};`);
    this.write('');
    this.writeModules();
    this.writeClasses();
    this.writeEnums();
    this.writeCommonDefs();
  }
}
