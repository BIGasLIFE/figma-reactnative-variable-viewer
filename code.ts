type NestedObject = {
  [key: string]: NestedObject | string | number | boolean;
};

figma.showUI(__html__, { width: 450, height: 700 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === "get-variables") {
    await getVariables();
  }
};

async function getVariables() {
  try {
    // ローカル変数とコレクションを取得
    const localVariables = await figma.variables.getLocalVariablesAsync();

    const collections =
      await figma.variables.getLocalVariableCollectionsAsync();

    // 変数をコレクションごとにグループ化
    const variablesByCollection = await Promise.all(
      collections.map(async (collection) => {
        const variables = localVariables.filter(
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

              const data = arrayToNestedObject(filteredTmp);

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
    const name = resolvedValue !== null ? resolvedValue.name : "";
    resultValue = `##${generateVariableString(name)}##`;
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

function arrayToNestedObject(
  arr: Array<{ name: string; value: string | number | boolean }>
) {
  const result: NestedObject = {};

  arr.forEach((item) => {
    // スラッシュで分割してパスの配列を作成
    const paths = item.name.split("/");
    const camelPaths = paths.map((path) => kebabToCamel(path));
    let current = result;

    // 最後のパス以外をループ
    camelPaths.slice(0, -1).forEach((path) => {
      if (!(path in current)) {
        current[path] = {};
      }

      current = current[path] as NestedObject;
    });

    // 最後のパスに値を設定
    current[camelPaths[camelPaths.length - 1]] = item.value;
  });

  return result;
}

function kebabToCamel(kebabCase: string): string {
  return kebabCase.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function generateVariableString(path: string) {
  // スラッシュで分割
  const parts = path.split("/");

  if (parts.length < 2) {
    return path;
  }

  // 先頭部分をキャメルケースに変換
  const camelCase = parts[0]
    .split("-")
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join("");

  // 残り部分をブラケット表記に変換
  const keys = parts
    .slice(1)
    .map((part) => `['${part}']`)
    .join("");

  // 最終的な文字列を生成
  return `${camelCase}${keys}`;
}

function isVariableAlias(
  variableValue: VariableValue
): variableValue is VariableAlias {
  return typeof variableValue === "object" && "id" in variableValue;
}
