import mongoose from "mongoose";
export declare const User: mongoose.Model<{
    password: string;
    username?: string | null | undefined;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    password: string;
    username?: string | null | undefined;
}> & {
    password: string;
    username?: string | null | undefined;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    password: string;
    username?: string | null | undefined;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    password: string;
    username?: string | null | undefined;
}>> & mongoose.FlatRecord<{
    password: string;
    username?: string | null | undefined;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
//# sourceMappingURL=user.model.d.ts.map