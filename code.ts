type NestedObject = {
  [key: string]: NestedObject | string | number | boolean;
};

figma.showUI(__html__, { width: 450, height: 700 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === "get-variables") {
    await getVariables();
  }
};

async function sortVariablesByDisplayOrder(localVariables: Variable[]) {
  // まずコレクションごとに変数をグループ化
  const variablesByCollection = new Map<string, Variable[]>();

  // 各変数をそのコレクションIDでグループ化
  localVariables.forEach((variable) => {
    const collectionId = variable.variableCollectionId;
    if (!variablesByCollection.has(collectionId)) {
      variablesByCollection.set(collectionId, []);
    }
    variablesByCollection.get(collectionId)?.push(variable);
  });

  // 結果を格納する配列
  const sortedVariables: Variable[] = [];

  // コレクション順に処理
  const collections = await figma.variables.getLocalVariableCollectionsAsync();

  collections.forEach((collection) => {
    const collectionVariables = variablesByCollection.get(collection.id) || [];

    // コレクション内の変数をvariableIdsの順序に並び替え
    if (collection.variableIds && collection.variableIds.length > 0) {
      // variableIdsの順序に基づいてソート
      const orderedVariables = collection.variableIds
        .map((id) => collectionVariables.find((v) => v.id === id))
        .filter((v): v is Variable => v !== undefined);

      // ソートされた変数を結果配列に追加
      sortedVariables.push(...orderedVariables);
    } else {
      // variableIdsがない場合は元の順序を維持
      sortedVariables.push(...collectionVariables);
    }
  });

  return sortedVariables;
}

async function getVariables() {
  try {
    // ローカル変数とコレクションを取得
    const localVariables = await figma.variables.getLocalVariablesAsync();
    const sortedLocalVariables = await sortVariablesByDisplayOrder(
      localVariables
    );

    const collections =
      await figma.variables.getLocalVariableCollectionsAsync();

    // 変数をコレクションごとにグループ化
    const variablesByCollection = await Promise.all(
      collections.map(async (collection) => {
        const variables = sortedLocalVariables.filter(
          (v) => v.variableCollectionId === collection.id
        );

        return {
          collectionId: collection.id,
          collectionName: collection.name,
          modes: collection.modes.map((mode) => ({
            id: mode.modeId,
            name: mode.name,
            isDefault: mode.modeId === collection.defaultModeId,
          })),

          variablesByMode: await Promise.all(
            collection.modes.map(async (mode) => {
              const tmp = await Promise.all(
                variables.map(async (variable) => {
                  const value = variable.valuesByMode[mode.modeId];
                  return await generateTypeScriptDefinition(variable, value);
                })
              );
              function isNotNull<T>(value: T | null): value is T {
                return value !== null;
              }
              const filteredTmp = tmp.filter(isNotNull);

              const data = arrayToNestedObject(collection.name, filteredTmp);

              return {
                modeId: mode.modeId,
                modeName: mode.name,
                data: data,
              };
            })
          ),
        };
      })
    );

    // UIにデータを送信
    figma.ui.postMessage({
      type: "variables-data",
      collections: variablesByCollection,
    });
  } catch (error) {
    console.error("Error:", error);
    if (error instanceof Error) {
      figma.ui.postMessage({
        type: "error",
        message: error.message,
      });
    } else {
      figma.ui.postMessage({
        type: "error",
        message: "An unknown error occurred",
      });
    }
  }
}

// TypeScript定義を生成する関数
async function generateTypeScriptDefinition(
  variable: Variable,
  value: VariableValue
): Promise<{
  name: string;
  value: string | number | boolean;
}> {
  let resultValue: string | boolean | number = "";

  if (isVariableAlias(value)) {
    const resolvedValue = await figma.variables.getVariableByIdAsync(value.id);
    if (resolvedValue !== null) {
      const collection = await figma.variables.getVariableCollectionByIdAsync(
        resolvedValue.variableCollectionId
      );
      if (collection !== null) {
        resultValue = `##${generateVariableString(
          collection.name,
          resolvedValue.name
        )}##`;
      }
    }
  } else {
    switch (variable.resolvedType) {
      case "COLOR": {
        const color = variableValueToColor(value);
        resultValue = color !== null ? `${rgbaToHex(color)}` : "";
        break;
      }
      case "FLOAT":
        resultValue = Number(value);
        break;
      case "STRING":
        resultValue = String(value);
        break;
      case "BOOLEAN":
        resultValue = value ? true : false;
        break;
    }
  }

  return {
    name: variable.name,
    value: resultValue,
  };
}

function rgbaToHex(color: RGBA): string {
  function componentToHex(c: number): string {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }

  const r = componentToHex(color.r);
  const g = componentToHex(color.g);
  const b = componentToHex(color.b);
  const a = componentToHex(color.a);
  return `#${r}${g}${b}${a}`;
}

function variableValueToColor(value: VariableValue | null): RGBA | null {
  if (value === null) return null;

  if (
    typeof value === "object" &&
    "r" in value &&
    "g" in value &&
    "b" in value
  ) {
    return {
      r: value.r,
      g: value.g,
      b: value.b,
      a: "a" in value ? value.a : 1,
    };
  }

  return null;
}

function toLowerFirstChar(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

// type NestedValues = Map<string, NestedValues | string | number | boolean>;

function arrayToNestedObject(
  collectionName: string,
  arr: Array<{ name: string; value: string | number | boolean }>
) {
  const result: NestedObject = {};

  arr.forEach((item) => {
    // スラッシュで分割してパスの配列を作成
    const paths = item.name.split("/");
    const camelNames = [collectionName.replace(/^_/, ""), ...paths].map(
      (path) => kebabToCamel(toLowerFirstChar(path))
    );
    let current = result;

    // コレクション名と最後のパス以外
    camelNames.slice(0, -1).forEach((path) => {
      if (!(path in current)) {
        current[path] = {};
      }

      current = current[path] as NestedObject;
    });

    // 最後のパスに値を設定
    current[camelNames[camelNames.length - 1]] = item.value;
  });

  return result;
}

function kebabToCamel(kebabCase: string): string {
  return kebabCase.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function generateVariableString(collectionName: string, path: string) {
  // スラッシュで分割
  const parts = path.split("/");

  if (parts.length < 2) {
    return path;
  }

  // 先頭部分をキャメルケースに変換
  const camelCase = collectionName
    .replace(/^_/, "")
    .split("-")
    .map(toLowerFirstChar)
    .join("");

  // 残り部分をブラケット表記に変換
  const keys = parts.map((part) => `['${kebabToCamel(part)}']`).join("");

  // 最終的な文字列を生成
  return `${camelCase}${keys}`;
}

function isVariableAlias(
  variableValue: VariableValue
): variableValue is VariableAlias {
  return typeof variableValue === "object" && "id" in variableValue;
}
