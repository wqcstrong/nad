import { u2b, u2s } from '../../utils';
import { Annotations } from '.';
import { AnnotationBase } from './AnnotationBase';

export class Api extends AnnotationBase<string> {
  public static iface = 'io.swagger.annotations.Api';
}

export class ApiOperation extends AnnotationBase<string> {
  public static iface = 'io.swagger.annotations.ApiOperation';
  get description() {
    return u2s(this.value);
  }
}

export class ApiModel extends AnnotationBase<string> {
  public static iface = 'io.swagger.annotations.ApiModel';
  get description(): string {
    return u2s(this.raw.description) || this.value;
  }
}

export class ApiModelProperty extends AnnotationBase<string> {
  public static iface = 'io.swagger.annotations.ApiModelProperty';
  get name() {
    return u2s(this.raw.name);
  }
  get description() {
    return this.value || this.name;
  }
  get hidden() {
    return u2b(this.raw.hidden);
  }
  get required() {
    return u2b(this.raw.required);
  }
}

/**
 * @see https://docs.swagger.io/swagger-core/v1.5.0/apidocs/io/swagger/annotations/ApiParam.html
 */
export class ApiParam extends AnnotationBase<string> {
  public static iface = 'io.swagger.annotations.ApiParam';
  get name() {
    return u2s(this.raw.name);
  }
  get required() {
    return u2b(this.raw.required);
  }
  get defaultValue() {
    return u2s(this.raw.defaultValue);
  }
}

export class SwaggerAnnotations {
  private annotations;
  constructor(annotations: Annotations) {
    this.annotations = annotations;
  }

  getApi() {
    return Api.create(this.annotations);
  }
  getApiOperation() {
    return ApiOperation.create(this.annotations);
  }
  getApiModel() {
    return ApiModel.create(this.annotations);
  }
  getApiModelProperty() {
    return ApiModelProperty.create(this.annotations);
  }
  getApiParam() {
    return ApiParam.create(this.annotations);
  }
}
