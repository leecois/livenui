import * as path from 'node:path'
import { type SourceFile, type StringLiteral, ts } from 'ts-morph'
import type { Component, ComponentFile } from '@/build/build-registry'
import type { ComponentBuilder } from '@/build/component-builder'
import type { OutputFile } from '@/registry/schema'

export type SourceReference =
  | {
      type: 'file'

      file: string
    }
  | {
      type: 'dependency'
      dep: string
      specifier: string
    }
  | {
      type: 'sub-component'
      resolved:
        | {
            type: 'local'
            component: Component
            file: ComponentFile
          }
        | {
            type: 'remote'
            component: Component
            file: ComponentFile
            registryName: string
          }
    }

export type Reference =
  | SourceReference
  | {
      type: 'custom'
      specifier: string
    }

export async function buildFile(
  file: ComponentFile,
  builder: ComponentBuilder,
  comp: Component,

  writeReference: (reference: Reference) => string | undefined
): Promise<OutputFile> {
  const sourceFilePath = path.join(builder.registryDir, file.path)

  const defaultResolve = (
    specifier: string,
    specified: SourceFile | undefined
  ): SourceReference => {
    let filePath: string
    if (specified) {
      filePath = specified.getFilePath()
    } else if (specifier.startsWith('./') || specifier.startsWith('../')) {
      filePath = path.join(path.dirname(sourceFilePath), specifier)
    } else {

      return {
        type: 'dependency',
        dep: builder.getDepFromSpecifier(specifier),
        specifier,
      }
    }

    if (path.relative(builder.registryDir, filePath).startsWith('../')) {
      return {
        type: 'dependency',
        dep: builder.getDepFromSpecifier(specifier),
        specifier,
      }
    }

    const sub = builder.getSubComponent(filePath)
    if (sub) {
      return {
        type: 'sub-component',
        resolved: {
          type: 'local',
          component: sub.component,
          file: sub.file,
        },
      }
    }

    return {
      type: 'file',
      file: filePath,
    }
  }

  function process(
    specifier: StringLiteral,
    getSpecifiedFile: () => SourceFile | undefined
  ) {
    const onResolve = comp.onResolve ?? builder.registry.onResolve

    let resolved: Reference = defaultResolve(
      specifier.getLiteralValue(),
      getSpecifiedFile()
    )

    if (onResolve) resolved = onResolve(resolved)
    const out = writeReference(resolved)
    if (out) specifier.setLiteralValue(out)
  }

  const sourceFile = await builder.createSourceFile(sourceFilePath)

  for (const item of sourceFile.getImportDeclarations()) {
    process(item.getModuleSpecifier(), () =>
      item.getModuleSpecifierSourceFile()
    )
  }

  for (const item of sourceFile.getExportDeclarations()) {
    const specifier = item.getModuleSpecifier()
    if (!specifier) continue

    process(specifier, () => item.getModuleSpecifierSourceFile())
  }

  const calls = sourceFile.getDescendantsOfKind(ts.SyntaxKind.CallExpression)

  for (const expression of calls) {
    if (
      expression.getExpression().isKind(ts.SyntaxKind.ImportKeyword) &&
      expression.getArguments().length === 1
    ) {
      const argument = expression.getArguments()[0]

      if (!argument.isKind(ts.SyntaxKind.StringLiteral)) continue

      process(argument, () =>
        argument.getSymbol()?.getDeclarations()[0].getSourceFile()
      )
    }
  }

  return {
    content: sourceFile.getFullText(),
    type: file.type,
    path: file.path,
    target: file.target,
  }
}
