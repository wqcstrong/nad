import { NadEnum, NadEnumConstant, NadRoute } from '../../types/nad';
import { Builder } from '../../Builder';
import { mg } from '../test-tools/mg';
import { DeepPartial } from '../../utils';

const config = { base: 'test', target: 'oc' } as const;

const buildEnum = (...constants: Partial<NadEnumConstant<unknown>>[]) => {
  const foo: Partial<NadRoute> = {
    name: 'foo',
    bean: 'test.Demo',
    parameters: [],
    returnType: 'test.MyType',
  };

  const MyType: DeepPartial<NadEnum> = {
    name: 'test.MyType',
    constants,
  };

  return new Builder({
    ...config,
    defs: { routes: [foo], enums: [MyType] },
  }).code.replace(/\s+/g, ' ');
};

test('number enum', () => {
  const code = buildEnum({ name: 'WATER', value: 1 }, { name: 'FIRE', value: 2 });
  expect(code).toContain(mg`
    typedef NSNumber MyType;
    const MyType *MyType_WATER = @1;
    const MyType *MyType_FIRE = @2;
  `);
});

test('string enum', () => {
  const code = buildEnum({ name: 'WATER', value: 'water' }, { name: 'FIRE', value: 'fire' });
  expect(code).toContain(mg`
    typedef NSString MyType;
    const MyType *MyType_WATER = @"water";
    const MyType *MyType_FIRE = @"fire";
  `);
});

test('mixed enum', () => {
  const code = buildEnum({ name: 'WATER', value: 'water' }, { name: 'FIRE', value: 1 });
  expect(code).toContain(mg`
    typedef NSObject MyType;
    const MyType *MyType_WATER = @"WATER";
    const MyType *MyType_FIRE = @"FIRE";
  `);
});

test('enum string includes spetial characters', () => {
  const code = buildEnum({ name: 'WATER', value: 'wa\nter' }, { name: 'FIRE', value: 'fi\\re' });
  expect(code).toContain(mg`
    typedef NSString MyType;
    const MyType *MyType_WATER = @"wa\\x0ater";
    const MyType *MyType_FIRE = @"fi\\x5cre";
  `);
});
