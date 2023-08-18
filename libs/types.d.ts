import { keySignature } from './index';
declare const typeErrSym: unique symbol;
declare const coercionTypeSymbol: unique symbol;
export declare abstract class Type<T> {
    [typeErrSym]?: string | (() => string);
    [coercionTypeSymbol]?: boolean;
    constructor();
    abstract parse(value: unknown): T;
    abstract and<K extends AnyType>(schema: K): any;
    or<K extends AnyType>(schema: K): UnionType<[this, K]>;
    optional(this: NullableType<any>): OptionalType<this>;
    optional(this: OptionalType<any>): this;
    optional(): OptionalType<this>;
    nullable(this: OptionalType<any>): NullableType<this>;
    nullable(this: NullableType<any>): this;
    nullable(): NullableType<this>;
    nullish(): NullishType<this>;
    try(value: unknown): T | ValidationError;
    map<K>(fn: (value: T) => K): MappedType<K>;
    onTypeError(msg: string | (() => string)): this;
    protected typeError(msg: string): ValidationError;
}
export type MappedType<T> = Type<T> & {
    withPredicate: (fn: Predicate<T>['func'], errMsg?: ErrMsg<T>) => Type<T> & MappedType<T>;
    default: (value: T | (() => T)) => Type<T> & MappedType<T>;
};
declare class MTypeClass<T extends AnyType, K> extends Type<K> implements WithPredicate<K>, Defaultable<K> {
    protected schema: T;
    protected mapFn: (value: Infer<T>) => K;
    private predicates;
    private defaultValue?;
    constructor(schema: T, mapFn: (value: Infer<T>) => K);
    parse(value: unknown): K;
    and<O extends AnyType>(other: O): never;
    withPredicate(fn: Predicate<K>['func'], errMsg?: ErrMsg<K>): MTypeClass<T, K>;
    default(value: K | (() => K)): MTypeClass<T, K>;
}
export declare class ValidationError extends Error {
    name: string;
    path?: (string | number)[];
    collectedErrors?: Record<string, ValidationError | undefined>;
    constructor(message: string, path?: (string | number)[], collectedErrors?: Record<string, ValidationError | undefined>);
}
export type Eval<T> = T extends any[] | Date | unknown ? T : Flat<T>;
export type AnyType = Type<any>;
export type Infer<T> = T extends AnyType ? (T extends Type<infer K> ? K : any) : T;
declare const allowUnknownSymbol: unique symbol;
declare const shapekeysSymbol: unique symbol;
type ObjectIntersection<O1 extends ObjectType<any>, O2 extends ObjectType<any>> = O1 extends ObjectType<infer Shape1> ? O2 extends ObjectType<infer Shape2> ? ObjectType<MergeShapes<Shape1, Shape2> extends infer T extends ObjectShape ? Flat<T> : never> : never : never;
type ArrayIntersection<A1 extends ArrayType<any>, A2 extends ArrayType<any>> = A1 extends ArrayType<infer S1> ? A2 extends ArrayType<infer S2> ? ArrayType<IntersectionResult<S1, S2>> : never : never;
type TupleIntersection<T1 extends TupleType<any>, T2 extends TupleType<any>> = T1 extends TupleType<infer S1> ? T2 extends TupleType<infer S2> ? TupleType<Join<S1, S2>> : never : never;
export type IntersectionResult<T extends AnyType, K extends AnyType> = T extends ObjectType<any> ? K extends ObjectType<any> ? ObjectIntersection<T extends infer X extends ObjectType<any> ? X : never, K extends infer X extends ObjectType<any> ? X : never> : IntersectionType<T extends infer X extends ObjectType<any> ? X : never, K> : T extends ArrayType<any> ? K extends ArrayType<any> ? ArrayIntersection<T, K> : IntersectionType<T, K> : T extends TupleType<any> ? K extends TupleType<any> ? TupleIntersection<T, K> : IntersectionType<T, K> : T extends MTypeClass<any, any> ? never : K extends MTypeClass<any, any> ? never : IntersectionType<T, K>;
type ErrMsg<T> = string | ((value: T) => string);
type Predicate<T> = {
    func: (value: T) => boolean;
    errMsg?: ErrMsg<T>;
};
interface WithPredicate<T> {
    withPredicate(fn: Predicate<T>['func'], errMsg?: ErrMsg<T>): any;
}
interface Defaultable<T> {
    default(value: T | (() => T)): any;
}
export type StringOptions = {
    min?: number;
    max?: number;
    /**
     * usually for number input coerce to a string, or sometimes uuid v4 uppercase should coerce to lower and vice versa
     */
    coerce?: boolean | 'lower' | 'upper';
    /**
     * enable to trim before and after spaces, or pass in character to trim
     */
    trim?: boolean | string;
    pattern?: RegExp;
    valid?: string[];
    predicate?: Predicate<string>['func'] | Predicate<string> | Predicate<string>[];
    default?: string | (() => string);
};
export declare class StringType extends Type<string> implements WithPredicate<string>, Defaultable<string> {
    private predicates;
    private defaultValue?;
    private coerceFlag?;
    private trimFlag?;
    constructor(opts?: StringOptions);
    parse(value?: unknown): string;
    and<K extends AnyType>(schema: K): IntersectionType<this, K>;
    pattern(regexp: RegExp, errMsg?: ErrMsg<string>): StringType;
    min(x: number, errMsg?: ErrMsg<string>): StringType;
    max(x: number, errMsg?: ErrMsg<string>): StringType;
    trim(trim?: boolean | string): this;
    coerce(transform?: boolean | 'lower' | 'upper'): this;
    valid(list: string[], errMsg?: ErrMsg<string>): StringType;
    withPredicate(fn: Predicate<string>['func'], errMsg?: ErrMsg<string>): StringType;
    default(value: string | (() => string)): StringType;
}
export declare class BooleanType extends Type<boolean> implements Defaultable<boolean> {
    private defaultValue?;
    constructor(defaultValue?: boolean | (() => boolean) | undefined);
    parse(value?: unknown): boolean;
    and<K extends AnyType>(schema: K): IntersectionType<this, K>;
    default(value: boolean | (() => boolean)): BooleanType;
}
export type NumberOptions = {
    min?: number;
    max?: number;
    coerce?: boolean;
    predicate?: Predicate<number>['func'] | Predicate<number> | Predicate<number>[];
    default?: number | (() => number);
};
export declare class NumberType extends Type<number> implements WithPredicate<number>, Defaultable<number> {
    private predicates;
    private defaultValue?;
    private coerceFlag?;
    constructor(opts?: NumberOptions);
    parse(value?: unknown): number;
    and<K extends AnyType>(schema: K): IntersectionType<this, K>;
    min(x: number, errMsg?: ErrMsg<number>): NumberType;
    max(x: number, errMsg?: ErrMsg<number>): NumberType;
    coerce(value?: boolean): NumberType;
    withPredicate(fn: Predicate<number>['func'], errMsg?: ErrMsg<number>): NumberType;
    default(value: number | (() => number)): NumberType;
}
export type BigIntOptions = {
    min?: number | bigint;
    max?: number | bigint;
    predicate?: Predicate<bigint>['func'] | Predicate<bigint> | Predicate<bigint>[];
    default?: bigint | (() => bigint);
};
export declare class BigIntType extends Type<bigint> implements WithPredicate<bigint>, Defaultable<bigint> {
    private readonly predicates;
    private readonly defaultValue?;
    constructor(opts?: BigIntOptions);
    parse(value?: unknown): bigint;
    and<K extends AnyType>(schema: K): IntersectionType<this, K>;
    min(x: number | bigint, errMsg?: ErrMsg<bigint>): BigIntType;
    max(x: number | bigint, errMsg?: ErrMsg<bigint>): BigIntType;
    withPredicate(fn: Predicate<bigint>['func'], errMsg?: ErrMsg<bigint>): BigIntType;
    default(value: bigint | (() => bigint)): BigIntType;
}
export declare class UndefinedType extends Type<undefined> {
    parse(value: unknown): undefined;
    and<K extends AnyType>(schema: K): IntersectionType<this, K>;
}
export declare class NullType extends Type<null> implements Defaultable<null> {
    private defaultValue;
    constructor();
    parse(value?: unknown): null;
    and<K extends AnyType>(schema: K): IntersectionType<this, K>;
    default(): NullType;
}
export type Literal = string | number | boolean | undefined | null;
export declare class LiteralType<T extends Literal> extends Type<T> implements Defaultable<T> {
    private readonly literal;
    private readonly defaultValue?;
    constructor(literal: T);
    parse(value?: unknown): T;
    and<K extends AnyType>(schema: K): IntersectionType<this, K>;
    default(): LiteralType<T>;
}
export declare class UnknownType extends Type<unknown> implements Defaultable<unknown> {
    private readonly defaultValue?;
    constructor();
    parse(value?: unknown): unknown;
    and<K extends AnyType>(schema: K): IntersectionType<this, K>;
    default(value: any | (() => any)): any;
}
export declare class AnyTypeClass extends Type<any> implements Defaultable<any> {
    private readonly defaultValue?;
    constructor();
    parse(value?: unknown): any;
    and<K extends AnyType>(schema: K): IntersectionType<this, K>;
    default(value: any | (() => any)): any;
}
export declare class OptionalType<T extends AnyType> extends Type<Infer<T> | undefined> {
    readonly schema: T;
    constructor(schema: T);
    parse(value: unknown, opts?: any): Infer<T> | undefined;
    required(): T;
    and<K extends AnyType>(schema: K): IntersectionType<this, K>;
}
type Nullable<T> = T | null;
export declare class NullableType<T extends AnyType> extends Type<Infer<T> | null> implements Defaultable<Infer<T> | null> {
    readonly schema: T;
    private readonly defaultValue?;
    constructor(schema: T);
    parse(value?: unknown): Infer<T> | null;
    and<K extends AnyType>(schema: K): IntersectionType<this, K>;
    required(): T;
    default(value: Nullable<Infer<T>> | (() => Nullable<Infer<T>>)): any;
}
type Nullish<T> = T | null | undefined;
export declare class NullishType<T extends AnyType> extends Type<Infer<T> | null | undefined> implements Defaultable<Infer<T> | null> {
    readonly schema: T;
    private readonly defaultValue?;
    constructor(schema: T);
    parse(value?: unknown): Infer<T> | null | undefined;
    and<K extends AnyType>(schema: K): IntersectionType<this, K>;
    required(): T;
    default(value: Nullish<Infer<T>> | (() => Nullish<Infer<T>>)): any;
}
export type DateOptions = {
    predicate?: Predicate<Date>['func'] | Predicate<Date> | Predicate<Date>[];
    default?: Date | (() => Date);
};
export declare class DateType extends Type<Date> implements WithPredicate<Date>, Defaultable<Date> {
    private readonly predicates;
    private readonly defaultValue?;
    constructor(opts?: DateOptions);
    parse(value?: unknown): Date;
    and<K extends AnyType>(schema: K): IntersectionType<this, K>;
    withPredicate(fn: Predicate<Date>['func'], errMsg?: ErrMsg<Date>): DateType;
    default(value: Date | (() => Date)): DateType;
    private stringToDate;
    private assertDate;
}
export type ObjectShape = {
    [key: string]: AnyType;
    [keySignature]?: AnyType;
};
type OptionalKeys<T extends ObjectShape> = {
    [key in keyof T]: undefined extends Infer<T[key]> ? (key extends symbol ? never : key) : never;
}[keyof T];
type RequiredKeys<T extends ObjectShape> = Exclude<string & keyof T, OptionalKeys<T>>;
type InferKeySignature<T extends ObjectShape> = T extends {
    [keySignature]: AnyType;
} ? T extends {
    [keySignature]: infer KeySig;
} ? KeySig extends AnyType ? {
    [key: string]: Infer<KeySig>;
} : {} : {} : {};
type Flat<T> = T extends {} ? (T extends Date ? T : {
    [key in keyof T]: T[key];
}) : T;
type InferObjectShape<T extends ObjectShape> = Flat<Eval<InferKeySignature<T> & {
    [key in OptionalKeys<T>]?: T[key] extends Type<infer K> ? K : any;
} & {
    [key in RequiredKeys<T>]: T[key] extends Type<infer K> ? K : any;
}>>;
export type ToUnion<T extends any[]> = T[number];
export type PartialShape<T extends ObjectShape> = {
    [key in keyof T]: T[key] extends OptionalType<any> ? T[key] : OptionalType<T[key]>;
};
export type DeepPartialShape<T extends ObjectShape> = {
    [key in keyof T]: T[key] extends ObjectType<infer K> ? OptionalType<ObjectType<DeepPartialShape<K>>> : T[key] extends OptionalType<any> ? T[key] : OptionalType<T[key]>;
};
type MergeShapes<T extends ObjectShape, K extends ObjectShape> = {
    [key in keyof (T & K)]: key extends keyof T ? key extends keyof K ? IntersectionResult<T[key], K[key]> : T[key] : key extends keyof K ? K[key] : never;
};
export type StringTypes<T> = T extends string ? T : never;
export type PathOptions = {
    suppressPathErrMsg?: boolean;
};
export type ObjectOptions<T extends ObjectShape> = {
    allowUnknown?: boolean;
    predicate?: Predicate<InferObjectShape<T>>['func'] | Predicate<InferObjectShape<T>> | Predicate<InferObjectShape<T>>[];
    default?: InferObjectShape<T> | (() => InferObjectShape<T>);
    collectErrors?: boolean;
};
export declare class ObjectType<T extends ObjectShape> extends Type<InferObjectShape<T>> implements WithPredicate<InferObjectShape<T>>, Defaultable<InferObjectShape<T>> {
    private readonly objectShape;
    private readonly predicates;
    private readonly defaultValue?;
    [allowUnknownSymbol]: boolean;
    [shapekeysSymbol]: string[];
    [coercionTypeSymbol]: boolean;
    [keySignature]: AnyType | undefined;
    private shouldCollectErrors;
    private _parse;
    constructor(objectShape: T, opts?: ObjectOptions<T>);
    parse(value?: unknown, parseOpts?: ObjectOptions<any> & PathOptions): InferObjectShape<T>;
    private buildPathError;
    private selectParser;
    private parseObject;
    private parseObjectCollect;
    private parseObjectConv;
    private parseObjectConvCollect;
    private parseRecord;
    private parseRecordCollect;
    private parseRecordConv;
    private parseRecordConvCollect;
    private parseMixRecord;
    private parseMixRecordCollect;
    private parseMixRecordConv;
    private parseMixRecordConvCollect;
    and<K extends AnyType>(schema: K): IntersectionResult<this, K>;
    pick<K extends T extends {
        [keySignature]: AnyType;
    } ? string : StringTypes<keyof T>>(keys: K[], opts?: ObjectOptions<Flat<Pick<T, Extract<StringTypes<keyof T>, ToUnion<typeof keys>>> & (T extends {
        [keySignature]: AnyType;
    } ? T extends {
        [keySignature]: infer KeySig;
    } ? {
        [key in Exclude<ToUnion<typeof keys>, keyof T>]: KeySig;
    } : {} : {})>>): ObjectType<Flat<Pick<T, Extract<StringTypes<keyof T>, ToUnion<typeof keys>>> & (T extends {
        [keySignature]: AnyType;
    } ? T extends {
        [keySignature]: infer KeySig;
    } ? {
        [key in Exclude<ToUnion<typeof keys>, keyof T>]: KeySig;
    } : {} : {})>>;
    omit<K extends StringTypes<keyof T>>(keys: K[], opts?: ObjectOptions<Eval<Omit<T, ToUnion<typeof keys>>>>): ObjectType<Flat<Omit<T, ToUnion<typeof keys>>>>;
    partial<K extends ObjectOptions<Eval<DeepPartialShape<T>>> & {
        deep: true;
    }>(opts: K): ObjectType<Flat<DeepPartialShape<T>>>;
    partial<K extends ObjectOptions<Eval<PartialShape<T>>> & PartialOpts>(opts?: K): ObjectType<Eval<PartialShape<T>>>;
    shape(): T;
    withPredicate(fn: Predicate<InferObjectShape<T>>['func'], errMsg?: ErrMsg<InferObjectShape<T>>): ObjectType<T>;
    default(value: InferObjectShape<T> | (() => InferObjectShape<T>)): ObjectType<T>;
    collectErrors(value?: boolean): ObjectType<T>;
    allowUnknownKeys(value?: boolean): ObjectType<T>;
}
export type ArrayOptions<T extends AnyType> = {
    length?: number;
    min?: number;
    max?: number;
    unique?: boolean;
    predicate?: Predicate<Infer<T>[]>['func'] | Predicate<Infer<T>[]> | Predicate<Infer<T>[]>[];
    default?: Infer<T>[] | (() => Infer<T>[]);
    coerce?: (value: string) => Infer<T>[];
};
export declare class ArrayType<T extends AnyType> extends Type<Infer<T>[]> implements WithPredicate<Infer<T>[]>, Defaultable<Infer<T>[]> {
    readonly schema: T;
    private readonly predicates;
    private readonly defaultValue?;
    private readonly coerceFn?;
    private readonly _parse;
    constructor(schema: T, opts?: ArrayOptions<T>);
    parse(value?: unknown, parseOptions?: PathOptions & ObjectOptions<any> & {
        coerced?: boolean;
    }): Infer<T>[];
    length(value: number, errMsg?: ErrMsg<Infer<T>[]>): ArrayType<T>;
    min(value: number, errMsg?: ErrMsg<Infer<T>[]>): ArrayType<T>;
    max(value: number, errMsg?: ErrMsg<Infer<T>[]>): ArrayType<T>;
    unique(): ArrayType<T>;
    and<K extends AnyType>(schema: K): IntersectionResult<this, K>;
    coerce(fn: (value: string) => Infer<T>[]): ArrayType<T>;
    withPredicate(fn: Predicate<Infer<T>[]>['func'], errMsg?: ErrMsg<Infer<T>[]>): ArrayType<T>;
    default(value: Infer<T>[] | (() => Infer<T>[])): ArrayType<T>;
}
type IntersecWrapper<A extends any, B extends any> = A extends AnyType ? B extends AnyType ? IntersectionResult<A, B> : never : never;
type JoinLeft<A extends AnyType[], B extends AnyType[]> = {
    [idx in keyof A]: idx extends keyof B ? IntersecWrapper<A[idx], B[idx]> : A[idx];
};
type JoinRight<A extends AnyType[], B extends AnyType[]> = {
    [idx in keyof B]: idx extends keyof A ? IntersecWrapper<A[idx], B[idx]> : B[idx];
};
type Join<A extends AnyType[], B extends AnyType[]> = JoinLeft<A, B> & JoinRight<A, B>;
type InferTuple<T extends AnyType[]> = {
    [key in keyof T]: T[key] extends Type<infer K> ? K : never;
};
type TupleOptions<T extends any[]> = {
    predicate?: Predicate<InferTuple<T>>['func'] | Predicate<InferTuple<T>> | Predicate<InferTuple<T>>[];
    default?: InferTuple<T> | (() => InferTuple<T>);
};
export declare class TupleType<T extends AnyType[]> extends Type<InferTuple<T>> implements WithPredicate<InferTuple<T>>, Defaultable<InferTuple<T>> {
    private readonly schemas;
    private readonly predicates;
    private readonly defaultValue?;
    constructor(schemas: T, opts?: TupleOptions<T>);
    parse(value?: unknown): InferTuple<T>;
    and<K extends AnyType>(schema: K): K extends TupleType<any> ? K extends TupleType<infer Arr> ? TupleType<Join<T, Arr>> : never : IntersectionType<this, K>;
    withPredicate(fn: Predicate<InferTuple<T>>['func'], errMsg?: ErrMsg<InferTuple<T>>): TupleType<T>;
    default(value: InferTuple<T> | (() => InferTuple<T>)): TupleType<T>;
}
type InferTupleUnion<T extends any[]> = Infer<T[number]>;
export type UnionOptions<T extends any[]> = {
    strict?: boolean;
    default?: InferTupleUnion<T> | (() => InferTupleUnion<T>);
};
type UnionIntersection<U extends UnionType<any>, T extends AnyType> = U extends UnionType<infer Schemas> ? UnionType<{
    [key in keyof Schemas]: Schemas[key] extends AnyType ? IntersectionResult<Schemas[key], T> : Schemas[key];
}> : never;
export declare class UnionType<T extends AnyType[]> extends Type<InferTupleUnion<T>> implements Defaultable<InferTupleUnion<T>> {
    private readonly schemas;
    private readonly strict;
    private readonly defaultValue?;
    constructor(schemas: T, opts?: UnionOptions<T>);
    parse(value?: unknown): InferTupleUnion<T>;
    and<K extends AnyType>(schema: K): UnionIntersection<UnionType<T>, K>;
    default(value: InferTupleUnion<T> | (() => InferTupleUnion<T>)): UnionType<T>;
}
export declare class IntersectionType<T extends AnyType, K extends AnyType> extends Type<Flat<Infer<T> & Infer<K>>> {
    private readonly left;
    private readonly right;
    private _schema;
    constructor(left: T, right: K);
    parse(value: unknown, opts?: PathOptions & ObjectOptions<any>): Flat<Infer<T> & Infer<K>>;
    and<K extends AnyType>(schema: K): IntersectionType<this, K>;
}
type ValueOf<T> = T[keyof T];
type EnumCoerceOptions = 'upper' | 'lower';
export type EnumOptions<T> = {
    coerce?: EnumCoerceOptions;
    defaultValue?: ValueOf<T> | (() => ValueOf<T>);
};
export declare class EnumType<T> extends Type<ValueOf<T>> implements Defaultable<ValueOf<T>>, WithPredicate<ValueOf<T>> {
    private readonly enumeration;
    private values;
    private readonly defaultValue?;
    private readonly coerceOpt?;
    private readonly predicates;
    constructor(enumeration: T, opts?: EnumOptions<T>);
    parse(value?: unknown): ValueOf<T>;
    check(value: unknown): value is ValueOf<T>;
    and<K extends AnyType>(schema: K): IntersectionType<this, K>;
    default(value: ValueOf<T> | (() => ValueOf<T>)): EnumType<T>;
    coerce(opt: EnumCoerceOptions): EnumType<T>;
    enum(): T;
    withPredicate(fn: (value: ValueOf<T>) => boolean, errMsg?: ErrMsg<ValueOf<T>> | undefined): this;
}
type DeepPartial<T> = {
    [key in keyof T]?: T[key] extends Object ? Eval<DeepPartial<T[key]>> : T[key];
};
export type PartialOpts = {
    deep: boolean;
};
export declare class PartialType<T extends AnyType, K extends PartialOpts> extends Type<K extends {
    deep: true;
} ? Eval<DeepPartial<Infer<T>>> : Partial<Infer<T>>> {
    private readonly schema;
    constructor(schema: T, opts?: K);
    parse(value: unknown): K extends {
        deep: true;
    } ? Eval<DeepPartial<Infer<T>>> : Partial<Infer<T>>;
    and<K extends AnyType>(schema: K): IntersectionType<this, K>;
}
export declare class LazyType<T extends () => AnyType> extends Type<Infer<ReturnType<T>>> {
    private readonly fn;
    constructor(fn: T);
    parse(value: unknown, opts?: PathOptions): Infer<ReturnType<T>>;
    and<K extends AnyType>(schema: K): IntersectionType<this, K>;
}
export {};
