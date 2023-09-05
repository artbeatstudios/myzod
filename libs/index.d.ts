import { AnyTypeClass, IntersectionType, ValidationError, Type, StringType, NumberType, LiteralType, ObjectType, ArrayType, UnionType, PartialType, TupleType, DateType, LazyType, UndefinedType, NullType, NullableType, EnumType, BooleanType, UnknownType, NumberOptions, Literal, ObjectShape, ObjectOptions, AnyType, ArrayOptions, UnionOptions, PartialOpts, IntersectionResult, DeepPartialShape, PartialShape, Eval, ToUnion, StringTypes, OptionalType, BigIntOptions, BigIntType, StringOptions, EnumOptions, keySignature } from './types';
export { ValidationError, Type, type Infer, type AnyType, type ObjectShape, NumberType, BooleanType, StringType, UndefinedType, NullType, ObjectType, ArrayType, TupleType, NullableType, OptionalType, type MappedType, DateType, UnknownType, AnyTypeClass, UnionType, IntersectionType, keySignature } from './types';
export declare const string: (opts?: StringOptions) => StringType;
export declare const boolean: () => BooleanType;
export declare const number: (opts?: NumberOptions) => NumberType;
export declare const bigint: (opts?: BigIntOptions) => BigIntType;
export declare const unknown: () => UnknownType;
export declare const any: () => AnyTypeClass;
export declare const literal: <T extends Literal>(literal: T) => LiteralType<T>;
export declare const object: <T extends ObjectShape>(shape: T, opts?: ObjectOptions<T> | undefined) => ObjectType<T>;
export declare const array: <T extends AnyType>(schema: T, opts?: ArrayOptions<T> | undefined) => ArrayType<T>;
export declare const union: <T extends AnyType[]>(schemas: T, opts?: UnionOptions<T> | undefined) => UnionType<T>;
export declare const intersection: <T extends AnyType, K extends AnyType>(l: T, r: K) => IntersectionResult<T, K>;
type LiteralWrapper<T extends any> = T extends Literal ? LiteralType<T> : never;
type ToLiteralUnion<T extends Literal[]> = {
    [key in keyof T]: LiteralWrapper<T[key]>;
};
export declare const literals: <T extends Literal[]>(...args: T) => UnionType<ToLiteralUnion<T>>;
export declare const record: <T extends AnyType>(schema: T) => ObjectType<{
    [keySignature]: T;
}>;
export declare const dictionary: <T extends AnyType>(schema: T) => ObjectType<{
    [keySignature]: T extends OptionalType<any> ? T : OptionalType<T>;
}>;
export declare const tuple: <T extends [] | [AnyType, ...AnyType[]]>(schemas: T) => TupleType<T>;
export declare const date: () => DateType;
export declare const lazy: <T extends () => AnyType>(fn: T) => LazyType<T>;
export declare function partial<T extends ObjectType<any>, K extends PartialOpts>(schema: T, opts?: K): T extends ObjectType<infer Shape> ? ObjectType<Eval<K extends {
    deep: true;
} ? DeepPartialShape<Shape> : PartialShape<Shape>>> : never;
export declare function partial<T extends AnyType, K extends PartialOpts>(schema: T, opts?: K): PartialType<T, K>;
export declare function pick<T extends ObjectType<any>, K extends T extends ObjectType<infer Shape> ? Shape extends {
    [keySignature]: AnyType;
} ? string : StringTypes<keyof Shape> : never>(schema: T, keys: K[]): T extends ObjectType<infer Shape> ? ObjectType<Eval<Pick<Shape, Extract<StringTypes<keyof Shape>, ToUnion<typeof keys>>> & (Shape extends {
    [keySignature]: AnyType;
} ? Shape extends {
    [keySignature]: infer KeySig;
} ? {
    [key in Exclude<ToUnion<typeof keys>, keyof Shape>]: KeySig;
} : {} : {})>> : never;
export declare function omit<T extends ObjectType<any>, K extends T extends ObjectType<infer Shape> ? StringTypes<keyof Shape> : never>(schema: T, keys: K[]): T extends ObjectType<infer Shape> ? ObjectType<Eval<Omit<Shape, ToUnion<typeof keys>>>> : never;
declare const undefinedValue: () => UndefinedType;
declare const nullValue: () => NullType;
declare const enumValue: <T>(e: T, opts?: EnumOptions<T> | undefined) => EnumType<T>;
export { undefinedValue as undefined, nullValue as null, enumValue as enum };
declare const _default: {
    Type: typeof Type;
    string: (opts?: StringOptions | undefined) => StringType;
    boolean: () => BooleanType;
    number: (opts?: NumberOptions | undefined) => NumberType;
    bigint: (opts?: BigIntOptions | undefined) => BigIntType;
    unknown: () => UnknownType;
    literal: <T extends Literal>(literal: T) => LiteralType<T>;
    literals: <T_1 extends Literal[]>(...args: T_1) => UnionType<ToLiteralUnion<T_1>>;
    date: () => DateType;
    object: <T_2 extends ObjectShape>(shape: T_2, opts?: ObjectOptions<T_2> | undefined) => ObjectType<T_2>;
    array: <T_3 extends AnyType>(schema: T_3, opts?: ArrayOptions<T_3> | undefined) => ArrayType<T_3>;
    union: <T_4 extends AnyType[]>(schemas: T_4, opts?: UnionOptions<T_4> | undefined) => UnionType<T_4>;
    intersection: <T_5 extends AnyType, K extends AnyType>(l: T_5, r: K) => IntersectionResult<T_5, K>;
    record: <T_6 extends AnyType>(schema: T_6) => ObjectType<{
        [keySignature]: T_6;
    }>;
    dictionary: <T_7 extends AnyType>(schema: T_7) => ObjectType<{
        [keySignature]: T_7 extends OptionalType<any> ? T_7 : OptionalType<T_7>;
    }>;
    tuple: <T_8 extends [] | [AnyType, ...AnyType[]]>(schemas: T_8) => TupleType<T_8>;
    partial: typeof partial;
    pick: typeof pick;
    omit: typeof omit;
    required: typeof required;
    lazy: <T_9 extends () => AnyType>(fn: T_9) => LazyType<T_9>;
    any: () => AnyTypeClass;
    undefined: () => UndefinedType;
    null: () => NullType;
    enum: <T_10>(e: T_10, opts?: EnumOptions<T_10> | undefined) => EnumType<T_10>;
    ValidationError: typeof ValidationError;
    keySignature: typeof keySignature;
    NumberType: typeof NumberType;
    BooleanType: typeof BooleanType;
    StringType: typeof StringType;
    UndefinedType: typeof UndefinedType;
    NullType: typeof NullType;
    ObjectType: typeof ObjectType;
    ArrayType: typeof ArrayType;
    TupleType: typeof TupleType;
    NullableType: typeof NullableType;
    OptionalType: typeof OptionalType;
    DateType: typeof DateType;
    UnknownType: typeof UnknownType;
    AnyTypeClass: typeof AnyTypeClass;
    UnionType: typeof UnionType;
    IntersectionType: typeof IntersectionType;
};
export default _default;
type Require<T extends AnyType> = T extends NullableType<infer S> ? Require<S> : T extends OptionalType<infer S> ? Require<S> : T;
export declare function required<T extends AnyType>(schema: T): Require<T>;
