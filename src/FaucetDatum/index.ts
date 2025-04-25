import { bs, int, pstruct } from "@harmoniclabs/plu-ts";

const FaucetDatum = pstruct({
  FaucetDatum: {
    withdrawalAmount: int,
    faucetTokenName: bs,
  },
});

export default FaucetDatum;
