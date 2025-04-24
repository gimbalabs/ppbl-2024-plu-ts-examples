import { PScriptContext, pfn, unit, passert, PTxOutRef, plet, pmatch, pdelay, pStr, ptraceIfFalse, punsafeConvertType, pBool } from "@harmoniclabs/plu-ts";

// One shot minting script
export const mintingContract = pfn([
  PTxOutRef.type,
  PScriptContext.type
], unit)
((utxoRef, {tx}) => {

  const pUtxoRef = plet(punsafeConvertType(utxoRef, PTxOutRef.type));

  const utxoInput = (plet(
    pmatch(
        tx.inputs.find( input => input.utxoRef.eq( pUtxoRef ) )
    )
    .onJust( () => pBool(true) )
    .onNothing(_ => pBool(false) )
  ));

  return passert.$(
    (ptraceIfFalse.$(pdelay(pStr("Invalid utxo Input"))).$(utxoInput))
    );
  
  //return passert.$(true);
});
