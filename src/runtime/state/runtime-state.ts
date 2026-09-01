import type { LiteralValue } from "../../core/model/value";

/** Runtime中のComponent Instance内UI Nodeを特定するAddress。 */
export interface RuntimeStateAddress {
  readonly pageId: string;
  readonly componentInstancePath: readonly string[];
  readonly localId: string;
}

/** UI NodeのState Propertyを更新する要求。 */
export interface RuntimeStateChange extends RuntimeStateAddress {
  readonly key: string;
  readonly value: LiteralValue;
}

/** UI NodeごとのRuntime State上書きを保持するSnapshot。 */
export type RuntimeState = Readonly<
  Record<string, Readonly<Record<string, LiteralValue>>>
>;

/** Runtime Stateから指定UI Nodeの上書き値を取得する。 */
export function readRuntimeNodeState(
  state: RuntimeState,
  address: RuntimeStateAddress,
): Readonly<Record<string, LiteralValue>> | undefined {
  return state[stateAddressKey(address)];
}

/** 1つのState Propertyを更新した新しいRuntime Stateを返す。 */
export function writeRuntimeState(
  state: RuntimeState,
  change: RuntimeStateChange,
): RuntimeState {
  const addressKey = stateAddressKey(change);
  return {
    ...state,
    [addressKey]: {
      ...state[addressKey],
      [change.key]: change.value,
    },
  };
}

function stateAddressKey(address: RuntimeStateAddress): string {
  return JSON.stringify([
    address.pageId,
    ...address.componentInstancePath,
    address.localId,
  ]);
}
