/* This file is part of AnsiComment
 *
 * Copyright 2019, Jeffery Stager
 *
 * AnsiComment is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AnsiComment is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('extension.ansicomment', () => {
    let ed = vscode.window.activeTextEditor;
    if (ed === undefined) return;
    if (ed.selections === null) return;

    const document = ed.document;

    ed.selections.forEach(async sel => {
      if (ed === undefined) return;

      if (sel.isEmpty) {
        let curLine = ed.selection.active.line;
        sel = new vscode.Selection(curLine, 0, curLine, 999);
      }

      let lines = document.getText(sel).split('\n');
      let newLines: string[] = [];

      // Check if we're going to comment the selection
      let willUncomment =
        lines
          .filter(line => line.trim().length !== 0)
          .every(line => line.trimLeft().startsWith('/*'));

      if (willUncomment) {
        // Uncomment the line
        lines
          .forEach(line => {
            newLines.push(line
              .replace(' */', '')
              .replace('/* ', '')
              .replace('*\\', '*')
              .replace('\\*', '*')
            );
          });
      } else {
        // Comment the line

        // TODO: Need to not fuck up the indention
        let minIndent = Math.min.apply(
          Number.MAX_SAFE_INTEGER,
          lines
            .map(line => {
              return {
                indent: line.length - line.trimLeft().length,
                exclude: line.trim().length === 0
              }
            })
            .filter(lineInfo => !lineInfo.exclude)
            .map(lineInfo => lineInfo.indent)
        );
        if (minIndent === Infinity) minIndent = 0;

        // lines.forEach(line => {
        //   if (line.trim().length === 0) {
        //     newLines.push(line);
        //     return;
        //   }

        //   newLines.push(
        //     ''
        //       .padStart(minIndent)
        //       .concat('/* ')
        //       .concat(
        //         line
        //           .trim()
        //           .replace('\\*', '\\\\*')
        //           .replace('*\\', '*\\\\')
        //           .replace('/*', '/\\*')
        //           .replace('*/', '*\\/')
        //           .concat(' */')
        //       )
        //   );
        // });
        lines.forEach(line => {
          if (line.trim().length === 0) {
            newLines.push(line);
            return;
          }

          let lineStart = line.substring(0, minIndent);
          let lineRest = line.substring(minIndent);
          lineRest = lineRest
            .replace('\\*', '\\\\*')
            .replace('*\\', '*\\\\')
            .replace('/*', '/\\**')
            .replace('*/', '*\\/');
          newLines.push(
            lineStart
              .concat('/* ')
              .concat(lineRest)
              .concat(' */')
          );
        });
      }

      if (newLines.length === 0) return;

      ed.edit(eb => {
        eb.replace(sel, newLines.join('\n'));
      });
    });
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
