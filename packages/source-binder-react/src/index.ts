import path from "node:path";
import { createRequire } from "node:module";
import { parse } from "@babel/parser";
import type { NodePath } from "@babel/traverse";
import type { JSXAttribute, JSXIdentifier, JSXOpeningElement, Node } from "@babel/types";
import MagicString from "magic-string";

const require = createRequire(import.meta.url);
const traverse = require("@babel/traverse").default as (
  ast: Node,
  visitors: Record<string, unknown>
) => void;

export type SourceBinderReactOptions = {
  include?: (id: string) => boolean;
  root?: string;
};

function toPosix(value: string): string {
  return value.replace(/\\/g, "/");
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function isIdentifierName(name: Node | null | undefined): name is JSXIdentifier {
  return Boolean(name && name.type === "JSXIdentifier");
}

function isIntrinsicElement(node: JSXOpeningElement): boolean {
  return isIdentifierName(node.name) && /^[a-z]/.test(node.name.name);
}

function hasPiSourceAttribute(node: JSXOpeningElement): boolean {
  return node.attributes.some((attribute): attribute is JSXAttribute => {
    return attribute.type === "JSXAttribute" && isIdentifierName(attribute.name) && attribute.name.name === "data-pi-source-id";
  });
}

function getNamedComponent(pathLike: NodePath<JSXOpeningElement>, fallback: string): string {
  let current: NodePath<Node> | null = pathLike.parentPath;

  while (current) {
    if (current.isFunctionDeclaration()) {
      const name = current.node.id?.name;
      if (name && /^[A-Z]/.test(name)) {
        return name;
      }
    }

    if (current.isVariableDeclarator()) {
      const id = current.node.id;
      if (id?.type === "Identifier" && /^[A-Z]/.test(id.name)) {
        return id.name;
      }
    }

    if (current.isClassDeclaration()) {
      const name = current.node.id?.name;
      if (name && /^[A-Z]/.test(name)) {
        return name;
      }
    }

    current = current.parentPath;
  }

  return fallback;
}

export function piSourceBinderReact(options: SourceBinderReactOptions = {}) {
  let viteRoot = options.root ? toPosix(options.root) : process.cwd();

  return {
    name: "pi-source-binder-react",
    apply: "serve" as const,
    enforce: "pre" as const,
    configResolved(config: { root: string }) {
      viteRoot = toPosix(config.root);
    },
    transform(code: string, id: string) {
      const fileId = toPosix(id.split("?")[0] || id);
      if (!/\.(tsx|jsx)$/.test(fileId)) {
        return null;
      }

      if (fileId.includes("node_modules")) {
        return null;
      }

      if (options.include && !options.include(fileId)) {
        return null;
      }

      const relativeFile = toPosix(path.relative(viteRoot, fileId));
      const fileStem = path.basename(fileId).replace(/\.(tsx|jsx)$/, "") || "Component";
      const magicString = new MagicString(code);
      let changed = false;

      const ast = parse(code, {
        sourceType: "module",
        errorRecovery: true,
        plugins: ["jsx", "typescript"]
      });

      traverse(ast, {
        JSXOpeningElement(openingPath: NodePath<JSXOpeningElement>) {
          const node = openingPath.node;
          if (!isIntrinsicElement(node) || hasPiSourceAttribute(node)) {
            return;
          }

          const insertAt = node.name.end;
          const location = node.loc?.start;
          if (!insertAt || !location) {
            return;
          }

          const componentName = getNamedComponent(openingPath, fileStem);
          const line = location.line;
          const column = location.column + 1;
          const sourceId = `${relativeFile}:${line}:${column}`;
          const attrs = [
            ` data-pi-source-id="${escapeAttribute(sourceId)}"`,
            ` data-pi-source-file="${escapeAttribute(relativeFile)}"`,
            ` data-pi-source-line="${line}"`,
            ` data-pi-source-column="${column}"`,
            ` data-pi-component="${escapeAttribute(componentName)}"`
          ].join("");

          magicString.appendLeft(insertAt, attrs);
          changed = true;
        }
      });

      if (!changed) {
        return null;
      }

      return {
        code: magicString.toString(),
        map: magicString.generateMap({ hires: true })
      };
    }
  };
}
