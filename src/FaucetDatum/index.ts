import { bs, int, pstruct } from "@harmoniclabs/plu-ts";

// modify the Datum as you prefer
const FaucetDatum = pstruct({
    FaucetDatum: {
        withdrawalAmount: int,
        faucetTokenName: bs
    }
});

export default FaucetDatum;