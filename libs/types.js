"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LazyType = exports.PartialType = exports.EnumType = exports.IntersectionType = exports.UnionType = exports.TupleType = exports.ArrayType = exports.ObjectType = exports.DateType = exports.NullishType = exports.NullableType = exports.OptionalType = exports.AnyTypeClass = exports.UnknownType = exports.LiteralType = exports.NullType = exports.UndefinedType = exports.BigIntType = exports.NumberType = exports.BooleanType = exports.StringType = exports.ValidationError = exports.Type = exports.keySignature = void 0;
exports.keySignature = Symbol('keySignature');
function clone(value) {
    if (typeof value !== 'object' || value === null) {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(elem => clone(elem));
    }
    const cpy = Object.create(null);
    for (const k in value) {
        cpy[k] = clone(value[k]);
    }
    for (const s of Object.getOwnPropertySymbols(value)) {
        cpy[s] = clone(value[s]);
    }
    Object.setPrototypeOf(cpy, Object.getPrototypeOf(value));
    return cpy;
}
const typeErrSym = Symbol('typeError');
const coercionTypeSymbol = Symbol('coercion');
class Type {
    constructor() { }
    or(schema) {
        return new UnionType([this, schema]);
    }
    optional() {
        if (this instanceof OptionalType) {
            return clone(this);
        }
        return new OptionalType(this);
    }
    nullable() {
        if (this instanceof NullableType) {
            return clone(this);
        }
        return new NullableType(this);
    }
    nullish() {
        if (this instanceof NullishType) {
            return clone(this);
        }
        return new NullishType(this);
    }
    try(value) {
        try {
            return this.parse.apply(this, arguments);
        }
        catch (err) {
            return err;
        }
    }
    map(fn) {
        return new MTypeClass(this, fn);
    }
    onTypeError(msg) {
        const cpy = clone(this);
        cpy[typeErrSym] = msg;
        return cpy;
    }
    typeError(msg) {
        const errMsg = (() => {
            const typErrValue = this[typeErrSym];
            if (typErrValue === undefined) {
                return msg;
            }
            if (typeof typErrValue === 'function') {
                return typErrValue();
            }
            return typErrValue;
        })();
        return new ValidationError(errMsg);
    }
}
exports.Type = Type;
class MTypeClass extends Type {
    constructor(schema, mapFn) {
        super();
        this.schema = schema;
        this.mapFn = mapFn;
        this.predicates = null;
        this[coercionTypeSymbol] = true;
    }
    parse(value) {
        const ret = value === undefined && this.defaultValue
            ? typeof this.defaultValue === 'function'
                ? this.defaultValue()
                : this.defaultValue
            : this.mapFn(this.schema.parse(value));
        if (this.predicates) {
            applyPredicates(this.predicates, ret);
        }
        return ret;
    }
    and(other) {
        throw new Error('mapped types cannot be intersected');
    }
    withPredicate(fn, errMsg) {
        return withPredicate(this, { func: fn, errMsg });
    }
    default(value) {
        return withDefault(this, value);
    }
}
class ValidationError extends Error {
    // @ts-ignore
    constructor(message, path, collectedErrors) {
        if (collectedErrors !== undefined) {
            message = Object.values(collectedErrors)
                .map(err => `error parsing object at path: "${prettyPrintPath(err?.path || [])}" - ${err?.message}`)
                .join('\n');
        }
        super(message);
        this.name = 'MyZodError';
        this.path = path;
        this.collectedErrors = collectedErrors;
    }
}
exports.ValidationError = ValidationError;
function typeOf(value) {
    if (value === null) {
        return 'null';
    }
    if (Array.isArray(value)) {
        return 'array';
    }
    return typeof value;
}
function prettyPrintPath(path) {
    return path.reduce((acc, elem, idx) => {
        if (typeof elem === 'number') {
            acc += `[${elem}]`;
        }
        else if (idx === 0) {
            acc += elem;
        }
        else {
            acc += '.' + elem;
        }
        return acc;
    }, '');
}
const allowUnknownSymbol = Symbol('allowUnknown');
const shapekeysSymbol = Symbol('shapeKeys');
const normalizePredicates = (predicate) => {
    if (!predicate) {
        return null;
    }
    if (typeof predicate === 'function') {
        return [{ func: predicate }];
    }
    if (Array.isArray(predicate)) {
        return predicate;
    }
    return [predicate];
};
const applyPredicates = (predicates, value) => {
    try {
        for (const predicate of predicates) {
            if (!predicate.func(value)) {
                throw new ValidationError(predicate.errMsg
                    ? typeof predicate.errMsg === 'function'
                        ? predicate.errMsg(value)
                        : predicate.errMsg
                    : 'failed anonymous predicate function');
            }
        }
    }
    catch (err) {
        if (err instanceof ValidationError) {
            throw err;
        }
        throw new ValidationError(err.message);
    }
};
const appendPredicate = (predicates, pred) => {
    if (!predicates) {
        return [pred];
    }
    return [...predicates, pred];
};
const withPredicate = (schema, predicate) => {
    const cpy = clone(schema);
    cpy.predicates = appendPredicate(cpy.predicates, predicate);
    return cpy;
};
const withDefault = (schema, value) => {
    const cpy = clone(schema);
    cpy[coercionTypeSymbol] = true;
    cpy.defaultValue = value;
    return cpy;
};
class StringType extends Type {
    constructor(opts) {
        super();
        this.predicates = normalizePredicates(opts?.predicate);
        this.defaultValue = opts?.default;
        this.coerceFlag = opts?.coerce;
        this.trimFlag = opts?.trim;
        this[coercionTypeSymbol] = opts?.default !== undefined;
        let self = this;
        if (typeof opts?.min !== 'undefined') {
            self = self.min(opts.min);
        }
        if (typeof opts?.max !== 'undefined') {
            self = self.max(opts.max);
        }
        if (typeof opts?.pattern !== 'undefined') {
            self = self.pattern(opts.pattern);
        }
        if (opts?.valid) {
            self = self.valid(opts.valid);
        }
        return self;
    }
    parse(value = typeof this.defaultValue === 'function' ? this.defaultValue() : this.defaultValue) {
        let coercedValue = value;
        if (this.coerceFlag === true && typeof value === 'number') {
            coercedValue = value.toString();
        }
        else if (this.coerceFlag === 'lower') {
            coercedValue = coercedValue.toLowerCase();
        }
        else if (this.coerceFlag === 'upper') {
            coercedValue = coercedValue.toUpperCase();
        }
        else if (typeof value !== 'string') {
            throw this.typeError('expected type to be string but got ' + typeOf(value));
        }
        if (this.trimFlag) {
            coercedValue = coercedValue.trim();
        }
        if (this.predicates) {
            applyPredicates(this.predicates, coercedValue);
        }
        return coercedValue;
    }
    and(schema) {
        return new IntersectionType(this, schema);
    }
    pattern(regexp, errMsg) {
        return this.withPredicate(value => regexp.test(value), errMsg || `expected string to match pattern ${regexp} but did not`);
    }
    min(x, errMsg) {
        return this.withPredicate((value) => value.length >= x, errMsg ||
            ((value) => `expected string to have length greater than or equal to ${x} but had length ${value.length}`));
    }
    max(x, errMsg) {
        return this.withPredicate((value) => value.length <= x, errMsg ||
            ((value) => `expected string to have length less than or equal to ${x} but had length ${value.length}`));
    }
    trim(trim = true) {
        this.trimFlag = trim;
        return this;
    }
    coerce(transform = true) {
        this.coerceFlag = transform;
        return this;
    }
    valid(list, errMsg) {
        return this.withPredicate((value) => list.includes(value), errMsg || `expected string to be one of: ${JSON.stringify(list)}`);
    }
    withPredicate(fn, errMsg) {
        return withPredicate(this, { func: fn, errMsg });
    }
    default(value) {
        return withDefault(this, value);
    }
}
exports.StringType = StringType;
class BooleanType extends Type {
    constructor(defaultValue) {
        super();
        this.defaultValue = defaultValue;
        this[coercionTypeSymbol] = defaultValue !== undefined;
    }
    parse(value = typeof this.defaultValue === 'function' ? this.defaultValue() : this.defaultValue) {
        if (typeof value !== 'boolean') {
            throw this.typeError('expected type to be boolean but got ' + typeOf(value));
        }
        return value;
    }
    and(schema) {
        return new IntersectionType(this, schema);
    }
    default(value) {
        return withDefault(this, value);
    }
}
exports.BooleanType = BooleanType;
class NumberType extends Type {
    constructor(opts = {}) {
        super();
        this.coerceFlag = opts.coerce;
        this.predicates = normalizePredicates(opts.predicate);
        this.defaultValue = opts.default;
        this[coercionTypeSymbol] = !!opts.coerce || opts.default !== undefined;
        let self = this;
        if (typeof opts.max !== 'undefined') {
            self = self.max(opts.max);
        }
        if (typeof opts.min !== 'undefined') {
            self = self.min(opts.min);
        }
        return self;
    }
    parse(value = typeof this.defaultValue === 'function' ? this.defaultValue() : this.defaultValue) {
        if (this.coerceFlag && typeof value === 'string') {
            const number = parseFloat(value);
            if (isNaN(number)) {
                throw this.typeError('expected type to be number but got string');
            }
            return this.parse(number);
        }
        if (typeof value !== 'number') {
            throw this.typeError('expected type to be number but got ' + typeOf(value));
        }
        if (this.predicates) {
            applyPredicates(this.predicates, value);
        }
        return value;
    }
    and(schema) {
        return new IntersectionType(this, schema);
    }
    min(x, errMsg) {
        return this.withPredicate(value => value >= x, errMsg || (value => `expected number to be greater than or equal to ${x} but got ${value}`));
    }
    max(x, errMsg) {
        return this.withPredicate(value => value <= x, errMsg || (value => `expected number to be less than or equal to ${x} but got ${value}`));
    }
    coerce(value) {
        return new NumberType({
            predicate: this.predicates || undefined,
            coerce: value !== undefined ? value : true,
            default: this.defaultValue,
        });
    }
    withPredicate(fn, errMsg) {
        return withPredicate(this, { func: fn, errMsg });
    }
    default(value) {
        return withDefault(this, value);
    }
}
exports.NumberType = NumberType;
class BigIntType extends Type {
    constructor(opts = {}) {
        super();
        this[coercionTypeSymbol] = true;
        this.predicates = normalizePredicates(opts.predicate);
        this.defaultValue = opts.default;
    }
    parse(value = typeof this.defaultValue === 'function' ? this.defaultValue() : this.defaultValue) {
        try {
            const int = BigInt(value);
            if (this.predicates) {
                applyPredicates(this.predicates, int);
            }
            return int;
        }
        catch (err) {
            if (err instanceof ValidationError) {
                throw err;
            }
            throw this.typeError('expected type to be bigint interpretable - ' + err.message.toLowerCase());
        }
    }
    and(schema) {
        return new IntersectionType(this, schema);
    }
    min(x, errMsg) {
        return this.withPredicate(value => value >= x, errMsg || (value => `expected bigint to be greater than or equal to ${x} but got ${value}`));
    }
    max(x, errMsg) {
        return this.withPredicate(value => value <= x, errMsg || (value => `expected bigint to be less than or equal to ${x} but got ${value}`));
    }
    withPredicate(fn, errMsg) {
        return withPredicate(this, { func: fn, errMsg });
    }
    default(value) {
        return withDefault(this, value);
    }
}
exports.BigIntType = BigIntType;
class UndefinedType extends Type {
    parse(value) {
        if (value !== undefined) {
            throw this.typeError('expected type to be undefined but got ' + typeOf(value));
        }
        return value;
    }
    and(schema) {
        return new IntersectionType(this, schema);
    }
}
exports.UndefinedType = UndefinedType;
class NullType extends Type {
    constructor() {
        super();
    }
    parse(value = this.defaultValue) {
        if (value !== null) {
            throw this.typeError('expected type to be null but got ' + typeOf(value));
        }
        return value;
    }
    and(schema) {
        return new IntersectionType(this, schema);
    }
    default() {
        return withDefault(this, null);
    }
}
exports.NullType = NullType;
class LiteralType extends Type {
    constructor(literal) {
        super();
        this.literal = literal;
    }
    parse(value = this.defaultValue) {
        if (value !== this.literal) {
            const typeofValue = typeof value !== 'object' ? JSON.stringify(value) : typeOf(value);
            throw this.typeError(`expected value to be literal ${JSON.stringify(this.literal)} but got ${typeofValue}`);
        }
        return value;
    }
    and(schema) {
        return new IntersectionType(this, schema);
    }
    default() {
        return withDefault(this, this.literal);
    }
}
exports.LiteralType = LiteralType;
class UnknownType extends Type {
    constructor() {
        super();
    }
    parse(value = typeof this.defaultValue === 'function' ? this.defaultValue() : this.defaultValue) {
        return value;
    }
    and(schema) {
        return new IntersectionType(this, schema);
    }
    default(value) {
        return withDefault(this, value);
    }
}
exports.UnknownType = UnknownType;
class AnyTypeClass extends Type {
    constructor() {
        super();
    }
    parse(value = typeof this.defaultValue === 'function' ? this.defaultValue() : this.defaultValue) {
        return value;
    }
    and(schema) {
        return new IntersectionType(this, schema);
    }
    default(value) {
        return withDefault(this, value);
    }
}
exports.AnyTypeClass = AnyTypeClass;
class OptionalType extends Type {
    constructor(schema) {
        super();
        this.schema = schema;
        this[coercionTypeSymbol] = this.schema[coercionTypeSymbol];
        this[shapekeysSymbol] = this.schema[shapekeysSymbol];
        this[allowUnknownSymbol] = this.schema[allowUnknownSymbol];
    }
    parse(value, opts) {
        if (value === undefined) {
            return undefined;
        }
        //@ts-ignore
        return this.schema.parse(value, opts);
    }
    required() {
        return clone(this.schema);
    }
    and(schema) {
        return new IntersectionType(this, schema);
    }
}
exports.OptionalType = OptionalType;
class NullableType extends Type {
    constructor(schema) {
        super();
        this.schema = schema;
        this[coercionTypeSymbol] = this.schema[coercionTypeSymbol];
        this[shapekeysSymbol] = this.schema[shapekeysSymbol];
        this[allowUnknownSymbol] = this.schema[allowUnknownSymbol];
    }
    parse(
    //@ts-ignore
    value = typeof this.defaultValue === 'function' ? this.defaultValue() : this.defaultValue) {
        if (value === null) {
            return null;
        }
        return this.schema.parse(value);
    }
    and(schema) {
        return new IntersectionType(this, schema);
    }
    required() {
        return clone(this.schema);
    }
    default(value) {
        return withDefault(this, value);
    }
}
exports.NullableType = NullableType;
class NullishType extends Type {
    constructor(schema) {
        super();
        this.schema = schema;
        this[coercionTypeSymbol] = this.schema[coercionTypeSymbol];
        this[shapekeysSymbol] = this.schema[shapekeysSymbol];
        this[allowUnknownSymbol] = this.schema[allowUnknownSymbol];
    }
    parse(
    //@ts-ignore
    value = typeof this.defaultValue === 'function' ? this.defaultValue() : this.defaultValue) {
        if (value === null) {
            return null;
        }
        if (value === undefined) {
            return undefined;
        }
        return this.schema.parse(value);
    }
    and(schema) {
        return new IntersectionType(this, schema);
    }
    required() {
        return clone(this.schema);
    }
    default(value) {
        return withDefault(this, value);
    }
}
exports.NullishType = NullishType;
class DateType extends Type {
    constructor(opts) {
        super();
        this[coercionTypeSymbol] = true;
        this.predicates = normalizePredicates(opts?.predicate);
        this.defaultValue = opts?.default;
    }
    parse(value = typeof this.defaultValue === 'function' ? this.defaultValue() : this.defaultValue) {
        const date = typeof value === 'string' ? this.stringToDate(value) : this.assertDate(value);
        if (this.predicates) {
            applyPredicates(this.predicates, date);
        }
        return date;
    }
    and(schema) {
        return new IntersectionType(this, schema);
    }
    withPredicate(fn, errMsg) {
        return withPredicate(this, { func: fn, errMsg });
    }
    default(value) {
        return withDefault(this, value);
    }
    stringToDate(str) {
        const date = new Date(str);
        if (isNaN(date.getTime())) {
            throw this.typeError(`expected date string to be valid date`);
        }
        return date;
    }
    assertDate(date) {
        if (!(date instanceof Date)) {
            throw this.typeError('expected type Date but got ' + typeOf(date));
        }
        return date;
    }
}
exports.DateType = DateType;
class ObjectType extends Type {
    constructor(objectShape, opts) {
        super();
        this.objectShape = objectShape;
        this.predicates = normalizePredicates(opts?.predicate);
        this.defaultValue = opts?.default;
        this.shouldCollectErrors = opts?.collectErrors === true;
        const keys = Object.keys(this.objectShape);
        this[exports.keySignature] = this.objectShape[exports.keySignature];
        this[allowUnknownSymbol] = opts?.allowUnknown === true;
        this[shapekeysSymbol] = keys;
        this[coercionTypeSymbol] =
            this.defaultValue !== undefined ||
                this[allowUnknownSymbol] ||
                Object.values(this.objectShape).some(schema => schema[coercionTypeSymbol]) ||
                !!(this.objectShape[exports.keySignature] && this.objectShape[exports.keySignature][coercionTypeSymbol]);
        this._parse = this.selectParser();
    }
    parse(value = typeof this.defaultValue === 'function' ? this.defaultValue() : this.defaultValue, parseOpts = {}) {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            throw this.typeError('expected type to be object but got ' + typeOf(value));
        }
        return this._parse(value, parseOpts);
    }
    buildPathError(err, key, parseOpts) {
        const path = err.path ? [key, ...err.path] : [key];
        const msg = parseOpts.suppressPathErrMsg
            ? err.message
            : `error parsing object at path: "${prettyPrintPath(path)}" - ${err.message}`;
        return new ValidationError(msg, path);
    }
    selectParser() {
        if (this[shapekeysSymbol].length === 0 && this[exports.keySignature]) {
            if (this[coercionTypeSymbol] && this.shouldCollectErrors) {
                return this.parseRecordConvCollect;
            }
            if (this[coercionTypeSymbol]) {
                return this.parseRecordConv;
            }
            if (this.shouldCollectErrors) {
                return this.parseRecordCollect;
            }
            return this.parseRecord;
        }
        if (this[exports.keySignature]) {
            if (this[coercionTypeSymbol] && this.shouldCollectErrors) {
                return this.parseMixRecordConvCollect;
            }
            if (this[coercionTypeSymbol]) {
                return this.parseMixRecordConv;
            }
            if (this.shouldCollectErrors) {
                return this.parseMixRecordCollect;
            }
            return this.parseMixRecord;
        }
        if (this[coercionTypeSymbol] && this.shouldCollectErrors) {
            return this.parseObjectConvCollect;
        }
        if (this[coercionTypeSymbol]) {
            return this.parseObjectConv;
        }
        if (this.shouldCollectErrors) {
            return this.parseObjectCollect;
        }
        return this.parseObject;
    }
    stripUndefined(value) {
        for (const key in value) {
            if (value[key] === undefined) {
                delete value[key];
            }
        }
        return value;
    }
    parseObject(value, parseOpts) {
        for (const key of this[shapekeysSymbol]) {
            try {
                const schema = this.objectShape[key];
                if (schema instanceof UnknownType && !value.hasOwnProperty(key)) {
                    throw schema.typeError(`expected key "${key}" of unknown type to be present on object`);
                }
                schema.parse(value[key], { suppressPathErrMsg: true });
            }
            catch (err) {
                throw this.buildPathError(err, key, parseOpts);
            }
        }
        if (this.predicates) {
            applyPredicates(this.predicates, value);
        }
        return value;
    }
    parseObjectCollect(value, parseOpts) {
        let hasError = false;
        const errs = {};
        for (const key of this[shapekeysSymbol]) {
            const schema = this.objectShape[key];
            if (schema instanceof UnknownType && !value.hasOwnProperty(key)) {
                hasError = true;
                errs[key] = this.buildPathError(schema.typeError(`expected key "${key}" of unknown type to be present on object`), key, { suppressPathErrMsg: true });
                continue;
            }
            const result = schema.try(value[key], { suppressPathErrMsg: true });
            if (result instanceof ValidationError) {
                hasError = true;
                errs[key] = this.buildPathError(result, key, { suppressPathErrMsg: true });
            }
        }
        if (hasError) {
            throw new ValidationError('', undefined, errs);
        }
        if (this.predicates) {
            applyPredicates(this.predicates, value);
        }
        return this.stripUndefined(value);
    }
    parseObjectConv(value, parseOpts) {
        const convVal = {};
        for (const key of this[shapekeysSymbol]) {
            try {
                const schema = this.objectShape[key];
                if (schema instanceof UnknownType && !value.hasOwnProperty(key)) {
                    throw schema.typeError(`expected key "${key}" of unknown type to be present on object`);
                }
                const parsedValue = schema.parse(value[key], { suppressPathErrMsg: true });
                // don't need to include undefined values
                if (parsedValue !== undefined) {
                    convVal[key] = parsedValue;
                }
            }
            catch (err) {
                throw this.buildPathError(err, key, parseOpts);
            }
        }
        if (this.predicates) {
            applyPredicates(this.predicates, convVal);
        }
        const keys = this[shapekeysSymbol];
        const allowUnknown = parseOpts.allowUnknown || this[allowUnknownSymbol];
        if (allowUnknown && !this.objectShape[exports.keySignature]) {
            for (const k in value) {
                const v = value[k];
                if (!keys.includes(k) && v !== undefined) {
                    // default is to strip unknown keys
                    convVal[k] = v;
                }
            }
        }
        return convVal;
    }
    parseObjectConvCollect(value, parseOpts) {
        const convVal = {};
        const errs = {};
        let hasError = false;
        for (const key of this[shapekeysSymbol]) {
            const schema = this.objectShape[key];
            if (schema instanceof UnknownType && !value.hasOwnProperty(key)) {
                hasError = true;
                errs[key] = this.buildPathError(schema.typeError(`expected key "${key}" of unknown type to be present on object`), key, { suppressPathErrMsg: true });
                continue;
            }
            const result = schema.try(value[key], { suppressPathErrMsg: true });
            if (result instanceof ValidationError) {
                hasError = true;
                errs[key] = this.buildPathError(result, key, { suppressPathErrMsg: true });
            }
            else {
                convVal[key] = result;
            }
        }
        if (hasError) {
            throw new ValidationError('', undefined, errs);
        }
        if (this.predicates) {
            applyPredicates(this.predicates, convVal);
        }
        return this.stripUndefined(convVal);
    }
    parseRecord(value, parseOpts) {
        for (const key in value) {
            try {
                this[exports.keySignature].parse(value[key], { suppressPathErrMsg: true });
            }
            catch (err) {
                throw this.buildPathError(err, key, parseOpts);
            }
        }
        if (this.predicates) {
            applyPredicates(this.predicates, value);
        }
        return value;
    }
    parseRecordCollect(value, parseOpts) {
        let hasError = false;
        const errs = {};
        for (const key in value) {
            const result = this[exports.keySignature].try(value[key], { suppressPathErrMsg: true });
            if (result instanceof ValidationError) {
                hasError = true;
                errs[key] = this.buildPathError(result, key, { suppressPathErrMsg: true });
            }
        }
        if (hasError) {
            throw new ValidationError('', undefined, errs);
        }
        if (this.predicates) {
            applyPredicates(this.predicates, value);
        }
        return this.stripUndefined(value);
    }
    parseRecordConv(value, parseOpts) {
        const convVal = {};
        for (const key in value) {
            try {
                convVal[key] = this[exports.keySignature].parse(value[key], { suppressPathErrMsg: true });
            }
            catch (err) {
                throw this.buildPathError(err, key, parseOpts);
            }
        }
        if (this.predicates) {
            applyPredicates(this.predicates, convVal);
        }
        return convVal;
    }
    parseRecordConvCollect(value, parseOpts) {
        const convVal = {};
        const errs = {};
        let hasError = false;
        for (const key in value) {
            const result = this[exports.keySignature].try(value[key], { suppressPathErrMsg: true });
            if (result instanceof ValidationError) {
                hasError = true;
                errs[key] = this.buildPathError(result, key, { suppressPathErrMsg: true });
            }
            else {
                convVal[key] = result;
            }
        }
        if (hasError) {
            throw new ValidationError('', undefined, errs);
        }
        if (this.predicates) {
            applyPredicates(this.predicates, convVal);
        }
        return convVal;
    }
    parseMixRecord(value, parseOpts) {
        for (const key of new Set(Object.keys(value).concat(this[shapekeysSymbol]))) {
            try {
                (this.objectShape[key] || this[exports.keySignature]).parse(value[key], { suppressPathErrMsg: true });
            }
            catch (err) {
                throw this.buildPathError(err, key, parseOpts);
            }
        }
        if (this.predicates) {
            applyPredicates(this.predicates, value);
        }
        return value;
    }
    parseMixRecordCollect(value, parseOpts) {
        let hasError = false;
        const errs = {};
        for (const key of new Set(Object.keys(value).concat(this[shapekeysSymbol]))) {
            const result = (this.objectShape[key] || this[exports.keySignature]).try(value[key], {
                suppressPathErrMsg: true,
            });
            if (result instanceof ValidationError) {
                hasError = true;
                errs[key] = this.buildPathError(result, key, { suppressPathErrMsg: true });
            }
        }
        if (hasError) {
            throw new ValidationError('', undefined, errs);
        }
        if (this.predicates) {
            applyPredicates(this.predicates, value);
        }
        return value;
    }
    parseMixRecordConv(value, parseOpts) {
        const convVal = {};
        for (const key of new Set(Object.keys(value).concat(this[shapekeysSymbol]))) {
            try {
                convVal[key] = (this.objectShape[key] || this[exports.keySignature]).parse(value[key], {
                    suppressPathErrMsg: true,
                });
            }
            catch (err) {
                throw this.buildPathError(err, key, parseOpts);
            }
        }
        if (this.predicates) {
            applyPredicates(this.predicates, convVal);
        }
        return convVal;
    }
    parseMixRecordConvCollect(value, parseOpts) {
        const convVal = {};
        const errs = {};
        let hasError = false;
        for (const key of new Set(Object.keys(value).concat(this[shapekeysSymbol]))) {
            const result = (this.objectShape[key] || this[exports.keySignature]).try(value[key], {
                suppressPathErrMsg: true,
            });
            if (result instanceof ValidationError) {
                hasError = true;
                errs[key] = this.buildPathError(result, key, { suppressPathErrMsg: true });
            }
            else {
                convVal[key] = result;
            }
        }
        if (hasError) {
            throw new ValidationError('', undefined, errs);
        }
        if (this.predicates) {
            applyPredicates(this.predicates, convVal);
        }
        return convVal;
    }
    and(schema) {
        if (schema instanceof ObjectType) {
            const keySet = new Set([...this[shapekeysSymbol], ...schema[shapekeysSymbol]]);
            const intersectShape = Array.from(keySet).reduce((acc, key) => {
                if (this.objectShape[key] && schema.objectShape[key]) {
                    acc[key] = this.objectShape[key].and(schema.objectShape[key]);
                }
                else if (this.objectShape[key]) {
                    acc[key] = this.objectShape[key];
                }
                else {
                    acc[key] = schema.objectShape[key];
                }
                return acc;
            }, {});
            const selfKeySig = this.objectShape[exports.keySignature];
            const targetKeySig = schema[exports.keySignature];
            if (selfKeySig && targetKeySig) {
                intersectShape[exports.keySignature] = selfKeySig.and(targetKeySig);
            }
            else if (selfKeySig || targetKeySig) {
                intersectShape[exports.keySignature] = selfKeySig || targetKeySig;
            }
            return new ObjectType(intersectShape);
        }
        return new IntersectionType(this, schema);
    }
    pick(keys, opts) {
        const pickedShape = keys.reduce((acc, key) => {
            if (this.objectShape[key] || this.objectShape[exports.keySignature]) {
                acc[key] = this.objectShape[key] || this.objectShape[exports.keySignature];
            }
            return acc;
        }, {});
        return new ObjectType(pickedShape, opts);
    }
    omit(keys, opts) {
        const pickedKeys = this[shapekeysSymbol].filter((x) => !keys.includes(x));
        if (!this[exports.keySignature]) {
            return this.pick(pickedKeys, opts);
        }
        return this.pick(pickedKeys, opts).and(new ObjectType({ [exports.keySignature]: this[exports.keySignature] }));
    }
    partial(opts) {
        const originalShape = this.objectShape;
        const shape = Object.keys(originalShape).reduce((acc, key) => {
            if (opts?.deep) {
                acc[key] = toPartialSchema(originalShape[key], opts).optional();
            }
            else {
                acc[key] = originalShape[key].optional();
            }
            return acc;
        }, {});
        const keysig = originalShape[exports.keySignature];
        if (keysig) {
            if (opts?.deep) {
                shape[exports.keySignature] = toPartialSchema(keysig, opts).optional();
            }
            else {
                shape[exports.keySignature] = keysig.optional();
            }
        }
        // Do not transfer predicates or default value to new object shape as this would not be type-safe
        return new ObjectType(shape, { allowUnknown: this[allowUnknownSymbol] });
    }
    shape() {
        return Object.assign({}, this.objectShape);
    }
    withPredicate(fn, errMsg) {
        return withPredicate(this, { func: fn, errMsg });
    }
    default(value) {
        const cpy = withDefault(this, value);
        cpy._parse = cpy.selectParser();
        return cpy;
    }
    collectErrors(value = true) {
        const cpy = clone(this);
        cpy.shouldCollectErrors = value;
        cpy._parse = cpy.selectParser();
        return cpy;
    }
    allowUnknownKeys(value = true) {
        const cpy = clone(this);
        cpy[allowUnknownSymbol] = value;
        cpy[coercionTypeSymbol] = cpy[coercionTypeSymbol] || value;
        cpy._parse = cpy.selectParser();
        return cpy;
    }
}
exports.ObjectType = ObjectType;
class ArrayType extends Type {
    constructor(schema, opts = {}) {
        super();
        this.schema = schema;
        this.predicates = normalizePredicates(opts.predicate);
        this.defaultValue = opts.default;
        this.coerceFn = opts.coerce;
        this[coercionTypeSymbol] =
            typeof this.coerceFn === 'function' ||
                this.defaultValue !== undefined ||
                this.schema[coercionTypeSymbol];
        this._parse =
            this.schema instanceof ObjectType || this.schema instanceof ArrayType || this.schema instanceof LazyType
                ? (elem, parseOptions) => this.schema.parse(elem, {
                    allowUnknown: parseOptions?.allowUnknown,
                    suppressPathErrMsg: true,
                })
                : (elem) => this.schema.parse(elem);
        let self = this;
        if (typeof opts.length !== 'undefined') {
            self = self.length(opts.length);
        }
        if (typeof opts.min !== 'undefined') {
            self = self.min(opts.min);
        }
        if (typeof opts.max !== 'undefined') {
            self = self.max(opts.max);
        }
        if (opts.unique === true) {
            self = self.unique();
        }
        return self;
    }
    parse(value = typeof this.defaultValue === 'function' ? this.defaultValue() : this.defaultValue, parseOptions) {
        if (typeof value === 'string' && typeof this.coerceFn === 'function' && !parseOptions?.coerced) {
            try {
                return this.parse(this.coerceFn(value), { ...parseOptions, coerced: true });
            }
            catch (e) {
                if (e instanceof ValidationError) {
                    throw e;
                }
                throw new ValidationError('error coercing string value to array - ' + e.message);
            }
        }
        if (!Array.isArray(value)) {
            throw this.typeError('expected an array but got ' + typeOf(value));
        }
        const convValue = this[coercionTypeSymbol] ? [] : undefined;
        for (let i = 0; i < value.length; i++) {
            try {
                if (convValue) {
                    convValue[i] = this._parse(value[i]);
                }
                else {
                    this._parse(value[i], parseOptions);
                }
            }
            catch (err) {
                const path = err.path ? [i, ...err.path] : [i];
                const msg = parseOptions?.suppressPathErrMsg
                    ? err.message
                    : `error at ${prettyPrintPath(path)} - ${err.message}`;
                throw new ValidationError(msg, path);
            }
        }
        if (this.predicates) {
            applyPredicates(this.predicates, convValue || value);
        }
        return convValue || value;
    }
    length(value, errMsg) {
        return this.withPredicate(arr => arr.length === value, errMsg || (arr => `expected array to have length ${value} but got ${arr.length}`));
    }
    min(value, errMsg) {
        return this.withPredicate(arr => arr.length >= value, errMsg || (arr => `expected array to have length greater than or equal to ${value} but got ${arr.length}`));
    }
    max(value, errMsg) {
        return this.withPredicate(arr => arr.length <= value, errMsg || (arr => `expected array to have length less than or equal to ${value} but got ${arr.length}`));
    }
    unique() {
        return this.withPredicate(arr => {
            const seenMap = new Map();
            arr.forEach((elem, idx) => {
                const seenAt = seenMap.get(elem);
                if (seenAt) {
                    throw new ValidationError(`expected array to be unique but found same element at indexes ${seenAt[0]} and ${idx}`);
                }
                seenMap.set(elem, [idx]);
            });
            return true;
        });
    }
    and(schema) {
        if (schema instanceof ArrayType) {
            return new ArrayType(this.schema.and(schema.schema));
        }
        return new IntersectionType(this, schema);
    }
    coerce(fn) {
        return new ArrayType(this.schema, {
            default: this.defaultValue,
            coerce: fn,
            predicate: this.predicates || undefined,
        });
    }
    withPredicate(fn, errMsg) {
        return withPredicate(this, { func: fn, errMsg });
    }
    default(value) {
        return withDefault(this, value);
    }
}
exports.ArrayType = ArrayType;
class TupleType extends Type {
    constructor(schemas, opts) {
        super();
        this.schemas = schemas;
        this.predicates = normalizePredicates(opts?.predicate);
        this.defaultValue = opts?.default;
        this[coercionTypeSymbol] =
            this.defaultValue !== undefined || schemas.some(schema => schema[coercionTypeSymbol]);
    }
    parse(value = typeof this.defaultValue === 'function' ? this.defaultValue() : this.defaultValue) {
        if (!Array.isArray(value)) {
            throw this.typeError('expected tuple value to be type array but got ' + typeOf(value));
        }
        if (value.length !== this.schemas.length) {
            throw this.typeError(`expected tuple length to be ${this.schemas.length} but got ${value.length}`);
        }
        const convValue = this[coercionTypeSymbol] ? [] : undefined;
        for (let i = 0; i < this.schemas.length; i++) {
            try {
                if (convValue) {
                    convValue.push(this.schemas[i].parse(value[i]));
                }
                else {
                    this.schemas[i].parse(value[i]);
                }
            }
            catch (err) {
                throw new ValidationError(`error parsing tuple at index ${i}: ${err.message}`);
            }
        }
        if (this.predicates) {
            applyPredicates(this.predicates, convValue || value);
        }
        return convValue || value;
    }
    and(schema) {
        if (schema instanceof TupleType) {
            const otherSchemaArray = schema.schemas;
            const nextSchemasArray = [];
            for (let i = 0; i < Math.max(this.schemas.length, otherSchemaArray.length); i++) {
                const current = this.schemas[i];
                const other = otherSchemaArray[i];
                if (current && other) {
                    nextSchemasArray.push(current.and(other));
                }
                else if (current) {
                    nextSchemasArray.push(current);
                }
                else {
                    nextSchemasArray.push(other);
                }
            }
            return new TupleType(nextSchemasArray);
        }
        return new IntersectionType(this, schema);
    }
    withPredicate(fn, errMsg) {
        return withPredicate(this, { func: fn, errMsg });
    }
    default(value) {
        return withDefault(this, value);
    }
}
exports.TupleType = TupleType;
class UnionType extends Type {
    constructor(schemas, opts) {
        super();
        this.schemas = schemas;
        this.strict = opts?.strict !== false;
        this.defaultValue = opts?.default;
        this[coercionTypeSymbol] =
            opts?.default !== undefined || schemas.some(schema => schema[coercionTypeSymbol]);
    }
    parse(
    //@ts-ignore
    value = typeof this.defaultValue === 'function' ? this.defaultValue() : this.defaultValue) {
        const errors = new Set();
        for (const schema of this.schemas) {
            try {
                if (this.strict === false && schema instanceof ObjectType) {
                    return schema.parse(value, { allowUnknown: true });
                }
                return schema.parse(value);
            }
            catch (err) {
                errors.add(err.message);
            }
        }
        const messages = Array.from(errors);
        if (messages.length === 1) {
            throw this.typeError(messages[0]);
        }
        throw this.typeError('No union satisfied:\n  ' + messages.join('\n  '));
    }
    and(schema) {
        const schemaIntersections = this.schemas.map(x => x.and(schema));
        return new UnionType(schemaIntersections, { strict: this.strict });
    }
    default(value) {
        return withDefault(this, value);
    }
}
exports.UnionType = UnionType;
function asUnionType(schema) {
    if (schema instanceof UnionType) {
        return schema;
    }
    if (schema instanceof IntersectionType && schema._schema instanceof UnionType) {
        return schema._schema;
    }
    return null;
}
class IntersectionType extends Type {
    constructor(left, right) {
        super();
        this.left = left;
        this.right = right;
        this[coercionTypeSymbol] = this.left[coercionTypeSymbol] && this.right[coercionTypeSymbol];
        // if (this[coercionTypeSymbol] && Object.getPrototypeOf(this.left) !== Object.getPrototypeOf(this.right)) {
        // }
        this[allowUnknownSymbol] = !!(this.left[allowUnknownSymbol] || this.right[allowUnknownSymbol]);
        if (this.left[shapekeysSymbol] && this.right[shapekeysSymbol]) {
            //@ts-ignore
            this[shapekeysSymbol] = Array.from(new Set([...this.left[shapekeysSymbol], ...this.right[shapekeysSymbol]]));
        }
        this._schema = (() => {
            if (this.left instanceof MTypeClass) {
                this.left.and(this.right); // throw error
            }
            if (this.right instanceof MTypeClass) {
                this.right.and(this.left); // throw err
            }
            const leftUnion = asUnionType(this.left);
            if (leftUnion) {
                return leftUnion.and(this.right);
            }
            const rightUnion = asUnionType(this.right);
            if (rightUnion) {
                return rightUnion.and(this.left);
            }
            if (this.left instanceof PartialType) {
                return new IntersectionType(this.left.schema, this.right);
            }
            if (this.right instanceof PartialType) {
                return new IntersectionType(this.left, this.right.schema);
            }
            return null;
        })();
    }
    parse(value, opts) {
        const allowUnknown = opts?.allowUnknown || this[allowUnknownSymbol];
        if (!allowUnknown && this[shapekeysSymbol]) {
            const expectedShapeKeys = this[shapekeysSymbol];
            const invalidKeys = Object.keys(value).filter((key) => !expectedShapeKeys.includes(key));
            if (invalidKeys.length > 0) {
                throw this.typeError('unexpected keys on object ' + JSON.stringify(invalidKeys));
            }
        }
        if (this._schema) {
            // @ts-ignore
            return this._schema.parse(value, opts);
        }
        this.left.parse(value);
        this.right.parse(value);
        return value;
    }
    and(schema) {
        return new IntersectionType(this, schema);
    }
}
exports.IntersectionType = IntersectionType;
class EnumType extends Type {
    constructor(enumeration, opts = {}) {
        super();
        this.enumeration = enumeration;
        this.values = Object.values(enumeration);
        this.predicates = null;
        this.coerceOpt = opts.coerce;
        this.defaultValue = opts.defaultValue;
        this[coercionTypeSymbol] = this.defaultValue !== undefined || this.coerceOpt !== undefined;
    }
    parse(
    //@ts-ignore
    value = typeof this.defaultValue === 'function' ? this.defaultValue() : this.defaultValue) {
        let coercedValue = value;
        if (typeof value === 'string' && this.coerceOpt === 'lower') {
            coercedValue = value.toLowerCase();
        }
        else if (typeof value === 'string' && this.coerceOpt === 'upper') {
            coercedValue = value.toUpperCase();
        }
        if (!this.values.includes(coercedValue)) {
            throw this.typeError(`error ${JSON.stringify(value)} not part of enum values`);
        }
        if (this.predicates) {
            applyPredicates(this.predicates, coercedValue);
        }
        return coercedValue;
    }
    check(value) {
        return this.values.includes(value);
    }
    and(schema) {
        return new IntersectionType(this, schema);
    }
    default(value) {
        return withDefault(this, value);
    }
    coerce(opt) {
        return new EnumType(this.enumeration, { defaultValue: this.defaultValue, coerce: opt });
    }
    enum() {
        return this.enumeration;
    }
    withPredicate(fn, errMsg) {
        return withPredicate(this, { func: fn, errMsg });
    }
}
exports.EnumType = EnumType;
function toPartialSchema(schema, opts) {
    if (schema instanceof ObjectType) {
        return schema.partial({ deep: opts?.deep || false });
    }
    if (schema instanceof IntersectionType) {
        return new IntersectionType(toPartialSchema(schema.left, opts), toPartialSchema(schema.right, opts));
    }
    if (schema instanceof UnionType) {
        return new UnionType(schema.schemas.map((schema) => toPartialSchema(schema, opts)));
    }
    if (schema instanceof ArrayType) {
        if (opts?.deep) {
            return new ArrayType(toPartialSchema(schema.schema, opts).optional());
        }
        return new ArrayType(schema.schema.optional());
    }
    return schema;
}
class PartialType extends Type {
    constructor(schema, opts) {
        super();
        this.schema = toPartialSchema(schema, opts);
        this[coercionTypeSymbol] = this.schema[coercionTypeSymbol];
    }
    parse(value) {
        return this.schema.parse(value);
    }
    and(schema) {
        return new IntersectionType(this, schema);
    }
}
exports.PartialType = PartialType;
// @ts-ignore
class LazyType extends Type {
    constructor(fn) {
        super();
        this.fn = fn;
        // Since we can't know what the schema is we can't assume its not a coercionType and we need to disable the optimization
        this[coercionTypeSymbol] = true;
    }
    parse(value, opts) {
        const schema = this.fn();
        if (opts?.suppressPathErrMsg && schema instanceof ObjectType) {
            return schema.parse(value, opts);
        }
        return schema.parse(value);
    }
    and(schema) {
        return new IntersectionType(this, schema);
    }
}
exports.LazyType = LazyType;
