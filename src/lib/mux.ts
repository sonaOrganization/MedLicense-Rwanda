import Mux from "@mux/mux-node";

let _mux: Mux | null = null;

export function getMux(): Mux {
  if (!_mux) {
    _mux = new Mux({
      tokenId: process.env.MUX_TOKEN_ID!,
      tokenSecret: process.env.MUX_TOKEN_SECRET!,
      jwtSigningKey: process.env.MUX_SIGNING_KEY_ID,
      jwtPrivateKey: process.env.MUX_SIGNING_PRIVATE_KEY,
    });
  }
  return _mux;
}
