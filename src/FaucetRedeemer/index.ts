import { bs, PPubKeyHash, pstruct } from "@harmoniclabs/plu-ts";

const FaucetRedeemer = pstruct({
  Withdraw: {
    senderPkh: PPubKeyHash.type,
    accessTokenName: bs,
  },
});

export default FaucetRedeemer;
