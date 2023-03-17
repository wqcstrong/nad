import { Member } from './Member';
import { Type } from './Type';
import { u2a, u2s } from '../utils';
import type { Root } from './Root';
import { DefBase } from './DefBase';

export class Class extends DefBase {
  /**
   * Generic type parameters.
   * For example, the value of typeParameters is [ "T", "M" ] for `class Foo<T, M> {}`
   */
  public readonly typeParameters;
  public readonly defName;
  public readonly description;

  constructor(raw: unknown, builder: Root) {
    super(raw, builder);
    this.typeParameters = u2a(this.raw.typeParameters, u2s);
    this.defName = this.moduleName;
    this.description = this.annotations.swagger.getApiModel()?.description;
    if (this.typeParameters.length) {
      const pars = this.typeParameters.join(', ');
      this.defName += `<${pars}>`;
    }
  }

  get members() {
    const value = u2a(this.raw.members, (i) => new Member(i, this)).filter((m) => m.visible);
    Object.defineProperty(this, 'members', { configurable: true, value });
    return value;
  }

  get superclass() {
    const value = Type.create(u2s(this.raw.superclass), this);
    Object.defineProperty(this, 'superclass', { configurable: true, value });
    return value;
  }

  // findAnnotation<T = Record<string, unknown>>(name: string, deep = false): T | null {
  //   const anno = this.annotations.find(name);
  //   if (anno) return anno as T;
  //   if (deep) {
  //     const clz = this.superclass?.clz;
  //     if (clz instanceof Class) return clz.findAnnotation<T>(name, deep);
  //   }
  //   return null;
  // }

  spread() {
    this.superclass.valueOf();
    this.members.valueOf();
  }
}
