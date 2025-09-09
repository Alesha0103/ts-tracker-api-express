import { Schema, model, Document } from "mongoose";

export interface IToken extends Document {
    user: Schema.Types.ObjectId;
    refreshToken: string;
}

const TokenSchema = new Schema<IToken>({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    refreshToken: { type: String, required: true },
});

export default model<IToken>("Token", TokenSchema);
