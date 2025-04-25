import {
  data,
  pdelay,
  pfn,
  pmatch,
  PScriptContext,
  pStr,
  ptraceIfFalse,
  plet,
  passert,
  perror,
  PMaybe,
  unit,
  punsafeConvertType,
  bs,
  PTxOutRef,
  PTxOut,
  int,
  pInt,
} from "@harmoniclabs/plu-ts";
import FaucetDatum from "../FaucetDatum";
import FaucetRedeemer from "../FaucetRedeemer";

export const faucetContract = pfn(
  [bs, bs, PScriptContext.type],
  unit,
)((accessTokenSymbol, faucetTokenSymbol, ctx) => {
  const { redeemer, tx, purpose } = ctx;
  const maybeDatum = plet(
    pmatch(purpose)
      .onSpending(({ datum }) => datum)
      ._((_) => perror(PMaybe(data).type)),
  );

  const datum = plet(punsafeConvertType(maybeDatum.unwrap, FaucetDatum.type));
  const red = plet(punsafeConvertType(redeemer, FaucetRedeemer.type));

  const ownUtxoRef = plet(
    pmatch(purpose)
      .onSpending(({ utxoRef }) => utxoRef)
      ._((_) => perror(PTxOutRef.type)),
  );

  const ownInput = plet(
    pmatch(tx.inputs.find((input) => input.utxoRef.eq(ownUtxoRef)))
      .onJust(({ val }) => val.resolved)
      .onNothing((_) => perror(PTxOut.type) as any),
  );

  const ownOutput = plet(
    pmatch(tx.outputs.find((output) => output.address.eq(ownInput.address)))
      .onJust(({ val }) => val)
      .onNothing((_) => perror(PTxOut.type) as any),
  );

  const faucetTokenOutputContract = plet(
    ownOutput.value
      .amountOf(faucetTokenSymbol, datum.faucetTokenName)
      .add(datum.withdrawalAmount),
  ).eq(ownInput.value.amountOf(faucetTokenSymbol, datum.faucetTokenName));

  const accessTokenOutputPkh = plet(
    pmatch(
      tx.outputs.find((output) =>
        output.address.credential.hash.eq(red.senderPkh),
      ),
    )
      .onJust(({ val }) =>
        val.value.amountOf(accessTokenSymbol, red.accessTokenName),
      )
      .onNothing((_) =>
        perror(int, "Access token not found in output contract"),
      ),
  ).eq(pInt(1));

  const faucetTokenOutputPkh = plet(
    pmatch(
      tx.outputs.find((output) =>
        output.address.credential.hash.eq(red.senderPkh),
      ),
    )
      .onJust(({ val }) =>
        val.value.amountOf(faucetTokenSymbol, datum.faucetTokenName),
      )
      .onNothing(
        (_) => perror(int, "Faucet token not found in output pkh") as any,
      ),
  ).eq(datum.withdrawalAmount);

  return passert.$(
    ptraceIfFalse
      .$(pdelay(pStr("Invalid accessTokenOutputPkh")))
      .$(accessTokenOutputPkh)
      .and(
        ptraceIfFalse
          .$(pdelay(pStr("Invalid faucetTokenOutputPkh")))
          .$(faucetTokenOutputPkh),
      )
      .and(
        ptraceIfFalse
          .$(pdelay(pStr("Invalid faucetTokenOutputContract")))
          .$(faucetTokenOutputContract),
      )
      .and(
        ptraceIfFalse
          .$(pdelay(pStr("Invalid Output Datum")))
          .$(ownInput.datum.eq(ownOutput.datum)),
      ),
  );
});
