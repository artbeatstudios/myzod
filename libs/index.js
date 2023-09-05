"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.required = exports.enum = exports.null = exports.undefined = exports.omit = exports.pick = exports.partial = exports.lazy = exports.date = exports.tuple = exports.dictionary = exports.record = exports.literals = exports.intersection = exports.union = exports.array = exports.object = exports.literal = exports.any = exports.unknown = exports.bigint = exports.number = exports.boolean = exports.string = exports.keySignature = exports.IntersectionType = exports.UnionType = exports.AnyTypeClass = exports.UnknownType = exports.DateType = exports.OptionalType = exports.NullableType = exports.TupleType = exports.ArrayType = exports.ObjectType = exports.NullType = exports.UndefinedType = exports.StringType = exports.BooleanType = exports.NumberType = exports.Type = exports.ValidationError = void 0;
const types_1 = require("./types");
var types_2 = require("./types");
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return types_2.ValidationError; } });
Object.defineProperty(exports, "Type", { enumerable: true, get: function () { return types_2.Type; } });
// Types
Object.defineProperty(exports, "NumberType", { enumerable: true, get: function () { return types_2.NumberType; } });
Object.defineProperty(exports, "BooleanType", { enumerable: true, get: function () { return types_2.BooleanType; } });
Object.defineProperty(exports, "StringType", { enumerable: true, get: function () { return types_2.StringType; } });
Object.defineProperty(exports, "UndefinedType", { enumerable: true, get: function () { return types_2.UndefinedType; } });
Object.defineProperty(exports, "NullType", { enumerable: true, get: function () { return types_2.NullType; } });
Object.defineProperty(exports, "ObjectType", { enumerable: true, get: function () { return types_2.ObjectType; } });
Object.defineProperty(exports, "ArrayType", { enumerable: true, get: function () { return types_2.ArrayType; } });
Object.defineProperty(exports, "TupleType", { enumerable: true, get: function () { return types_2.TupleType; } });
Object.defineProperty(exports, "NullableType", { enumerable: true, get: function () { return types_2.NullableType; } });
Object.defineProperty(exports, "OptionalType", { enumerable: true, get: function () { return types_2.OptionalType; } });
Object.defineProperty(exports, "DateType", { enumerable: true, get: function () { return types_2.DateType; } });
Object.defineProperty(exports, "UnknownType", { enumerable: true, get: function () { return types_2.UnknownType; } });
Object.defineProperty(exports, "AnyTypeClass", { enumerable: true, get: function () { return types_2.AnyTypeClass; } });
Object.defineProperty(exports, "UnionType", { enumerable: true, get: function () { return types_2.UnionType; } });
Object.defineProperty(exports, "IntersectionType", { enumerable: true, get: function () { return types_2.IntersectionType; } });
Object.defineProperty(exports, "keySignature", { enumerable: true, get: function () { return types_2.keySignature; } });
const string = (opts) => new types_1.StringType(opts);
exports.string = string;
const boolean = () => new types_1.BooleanType();
exports.boolean = boolean;
const number = (opts) => new types_1.NumberType(opts);
exports.number = number;
const bigint = (opts) => new types_1.BigIntType(opts);
exports.bigint = bigint;
const unknown = () => new types_1.UnknownType();
exports.unknown = unknown;
const any = () => new types_1.AnyTypeClass();
exports.any = any;
const literal = (literal) => new types_1.LiteralType(literal);
exports.literal = literal;
const object = (shape, opts) => new types_1.ObjectType(shape, opts);
exports.object = object;
const array = (schema, opts) => new types_1.ArrayType(schema, opts);
exports.array = array;
const union = (schemas, opts) => new types_1.UnionType(schemas, opts);
exports.union = union;
const intersection = (l, r) => l.and(r);
exports.intersection = intersection;
const literals = (...args) => new types_1.UnionType(args.map(exports.literal));
exports.literals = literals;
const record = (schema) => new types_1.ObjectType({ [types_1.keySignature]: schema });
exports.record = record;
const dictionary = (schema) => {
    if (schema instanceof types_1.OptionalType) {
        return new types_1.ObjectType({ [types_1.keySignature]: schema });
    }
    return new types_1.ObjectType({ [types_1.keySignature]: new types_1.OptionalType(schema) });
};
exports.dictionary = dictionary;
const tuple = (schemas) => new types_1.TupleType(schemas);
exports.tuple = tuple;
const date = () => new types_1.DateType();
exports.date = date;
const lazy = (fn) => new types_1.LazyType(fn);
exports.lazy = lazy;
function partial(schema, opts) {
    if (schema instanceof types_1.ObjectType) {
        return schema.partial(opts);
    }
    return new types_1.PartialType(schema, opts);
}
exports.partial = partial;
function pick(schema, keys) {
    return schema.pick(keys);
}
exports.pick = pick;
function omit(schema, keys) {
    return schema.omit(keys);
}
exports.omit = omit;
const undefinedValue = () => new types_1.UndefinedType();
exports.undefined = undefinedValue;
const nullValue = () => new types_1.NullType();
exports.null = nullValue;
const enumValue = (e, opts) => new types_1.EnumType(e, opts);
exports.enum = enumValue;
// Support default imports
exports.default = {
    Type: types_1.Type,
    string: exports.string,
    boolean: exports.boolean,
    number: exports.number,
    bigint: exports.bigint,
    unknown: exports.unknown,
    literal: exports.literal,
    literals: exports.literals,
    date: exports.date,
    object: exports.object,
    array: exports.array,
    union: exports.union,
    intersection: exports.intersection,
    record: exports.record,
    dictionary: exports.dictionary,
    tuple: exports.tuple,
    partial,
    pick,
    omit,
    required,
    lazy: exports.lazy,
    any: exports.any,
    undefined: undefinedValue,
    null: nullValue,
    enum: enumValue,
    ValidationError: types_1.ValidationError,
    keySignature: types_1.keySignature,
    // types
    NumberType: types_1.NumberType,
    BooleanType: types_1.BooleanType,
    StringType: types_1.StringType,
    UndefinedType: types_1.UndefinedType,
    NullType: types_1.NullType,
    ObjectType: types_1.ObjectType,
    ArrayType: types_1.ArrayType,
    TupleType: types_1.TupleType,
    NullableType: types_1.NullableType,
    OptionalType: types_1.OptionalType,
    DateType: types_1.DateType,
    UnknownType: types_1.UnknownType,
    AnyTypeClass: types_1.AnyTypeClass,
    UnionType: types_1.UnionType,
    IntersectionType: types_1.IntersectionType,
};
function required(schema) {
    if (schema instanceof types_1.NullableType) {
        return required(schema.required());
    }
    if (schema instanceof types_1.OptionalType) {
        return required(schema.required());
    }
    return schema;
}
exports.required = required;
