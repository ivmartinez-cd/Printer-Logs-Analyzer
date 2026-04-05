# Flujo de trabajo con Git

## Reglas activas en `main`

`main` tiene un **ruleset** activo en GitHub que impone:

| Regla | Qué significa |
|-------|--------------|
| Todo cambio entra por PR | No se puede hacer `git push` directo a `main` |
| CI debe pasar | El PR no se puede mergear si falla Frontend o Backend |
| No se puede borrar `main` | Protección contra eliminación accidental |
| No se puede hacer force push | `git push --force` a `main` está bloqueado |

Nadie puede saltear estas reglas — ni siquiera el dueño del repo.

---

## Flujo estándar para cualquier cambio

```
1. Estar en main actualizado
2. Crear un branch nuevo
3. Hacer los cambios y commits
4. Pushear el branch
5. Abrir un PR en GitHub
6. Esperar que CI pase
7. Mergear el PR
8. Volver a main y actualizar
```

### Paso a paso con comandos

```bash
# 1. Asegurarse de estar en main actualizado
git checkout main
git pull origin main

# 2. Crear un branch con nombre descriptivo
git checkout -b nombre-del-cambio
# Ejemplos: fix-parser-bug, feat-nueva-vista, docs-actualizar-readme

# 3. Hacer los cambios... luego commitear
git add archivo1.ts archivo2.py
git commit -m "tipo: descripción corta del cambio"

# 4. Pushear el branch a GitHub
git push origin nombre-del-cambio

# 5. Abrir el PR (desde terminal con gh)
gh pr create --title "título del PR" --body "descripción"
# O abrirlo directamente en github.com

# 6. Esperar CI — chequear desde terminal
gh pr checks <número-de-pr>

# 7. Mergear cuando CI pasa
gh pr merge <número-de-pr> --merge --delete-branch

# 8. Volver a main actualizado
git checkout main
git pull origin main
```

---

## Convención para nombres de branch

```
tipo-descripcion-corta
```

| Tipo | Cuándo usarlo |
|------|---------------|
| `feat-` | Nueva funcionalidad |
| `fix-` | Corrección de bug |
| `docs-` | Solo documentación |
| `refactor-` | Cambio de código sin nueva funcionalidad |
| `ci-` | Cambios en el workflow de CI |
| `test-` | Agregar o modificar tests |

Ejemplos: `feat-filtro-por-equipo`, `fix-parser-tabs`, `docs-api-endpoints`

---

## Convención para mensajes de commit

```
tipo: descripción en minúsculas
```

| Tipo | Cuándo usarlo |
|------|---------------|
| `feat:` | Nueva funcionalidad |
| `fix:` | Bug fix |
| `docs:` | Documentación |
| `refactor:` | Refactor sin cambio de comportamiento |
| `test:` | Tests |
| `ci:` | CI/CD |
| `chore:` | Tareas de mantenimiento (deps, config) |

Ejemplos:
```
feat: agregar filtro por equipo en saved-list
fix: parser no detectaba header con línea en blanco inicial
docs: documentar endpoints en CLAUDE.md
ci: actualizar actions a @v6
```

---

## ¿Qué pasa si CI falla?

```bash
# Ver qué falló
gh pr checks <número-de-pr>

# Ver el log detallado del job que falló
gh run view <run-id> --log-failed

# Corregir el error, commitear y pushear al mismo branch
git add .
git commit -m "fix: corregir error de typecheck"
git push origin nombre-del-cambio
# CI vuelve a correr automáticamente en el mismo PR
```

---

## ¿Qué pasa si `main` avanzó mientras trabajabas?

Si alguien mergeó otro PR mientras vos tenías un branch abierto, tu branch quedó desactualizado. Hay dos opciones:

**Opción A — Merge (más simple):**
```bash
git checkout main
git pull origin main
git checkout tu-branch
git merge main
git push origin tu-branch
```

**Opción B — Rebase (historial más limpio):**
```bash
git checkout main
git pull origin main
git checkout tu-branch
git rebase main
git push origin tu-branch --force-with-lease
```

`--force-with-lease` es más seguro que `--force`: falla si alguien más pusheó al branch mientras tanto.

> El ruleset de `main` tiene `strict_required_status_checks_policy: false`, lo que significa que GitHub **no** exige que el branch esté actualizado con `main` antes de mergear. No es obligatorio hacer el merge/rebase, pero es buena práctica.

---

## Resumen visual

```
main ──────────────────────────────────────────────► (protegido)
       │                              ▲
       │ git checkout -b mi-branch    │ gh pr merge
       ▼                              │
    mi-branch ── commit ── commit ── PR ── CI ✅ ──►
                                          CI ❌ → corregir y volver a pushear
```

---

## Comandos útiles de referencia rápida

```bash
git status                        # Ver estado del working directory
git log --oneline -10             # Últimos 10 commits
git diff main..mi-branch          # Ver qué cambió respecto a main
gh pr list                        # PRs abiertos
gh pr checks <nro>                # Estado del CI de un PR
gh run list                       # Últimos runs de CI
git stash                         # Guardar cambios sin commitear temporalmente
git stash pop                     # Recuperar cambios guardados
```
