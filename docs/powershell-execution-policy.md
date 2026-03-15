# Configurar PowerShell para desarrollo

Para que `npm run dev`, los scripts de Cursor y otros comandos funcionen sin errores de "script no firmado", configura la política de ejecución.

**Si `Get-ExecutionPolicy -List` muestra MachinePolicy = AllSigned:** la restricción viene de Directiva de grupo; no se puede quitar con `Set-ExecutionPolicy`. Usa el [bypass en el perfil](#bypass-automático-en-cada-sesión-sin-ser-admin) para que cada nueva ventana de PowerShell permita scripts.

## Si te dice "invalidado por una directiva en un ámbito más específico"

Significa que **LocalMachine** o **Group Policy** tienen algo más restrictivo (p. ej. AllSigned). Hay que cambiar ese ámbito.

### 1. Ver qué ámbito gana

```powershell
Get-ExecutionPolicy -List
```

- Si **MachinePolicy** = `AllSigned`: lo impone Directiva de grupo; no se puede cambiar con `Set-ExecutionPolicy`. Usa el bypass por proceso (perfil o comando cada vez).
- Si **LocalMachine** = `AllSigned`: puedes cambiarlo como administrador (ver paso 2).

### 2. Cambiar la política que está ganando (como administrador)

Abre **PowerShell como administrador** (clic derecho en el icono → "Ejecutar como administrador") y ejecuta:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine
```

Confirma con `S`. Con eso la máquina entera usará RemoteSigned y dejará de anular tu CurrentUser.

### 3. Alternativa sin ser admin: solo en esta sesión

Si no tienes permisos de administrador, en **cada nueva ventana de PowerShell** puedes hacer:

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

Solo vale para esa ventana. Al cerrarla se pierde. Puedes poner ese comando en tu perfil para que se ejecute al abrir PowerShell (ver más abajo).

## Opción recomendada cuando no hay políticas de empresa (solo tu usuario)

Si en tu PC no hay una política corporativa que lo impida, abre PowerShell (sin admin) y ejecuta:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Cuando pregunte, escribe `S` y Enter. Si luego ves el mensaje de "invalidado por un ámbito más específico", sigue los pasos de la sección anterior.

## Comprobar la política actual

```powershell
Get-ExecutionPolicy -List
```

Para `CurrentUser` deberías ver `RemoteSigned` después del cambio.

## Bypass automático en cada sesión (sin ser admin)

Si no puedes cambiar LocalMachine y no quieres escribir el bypass cada vez, añádelo a tu perfil de PowerShell:

1. Comprueba si existe el perfil:
   ```powershell
   Test-Path $PROFILE
   ```
2. Si sale `False`, créalo:
   ```powershell
   New-Item -Path $PROFILE -ItemType File -Force
   ```
3. Abre el perfil (por ejemplo en Notepad):
   ```powershell
   notepad $PROFILE
   ```
4. Añade esta línea, guarda y cierra:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
   ```
5. Cierra y vuelve a abrir PowerShell. En cada nueva sesión se aplicará el bypass solo a esa ventana.

## Revertir (volver a restringir)

```powershell
Set-ExecutionPolicy -ExecutionPolicy Restricted -Scope CurrentUser
```
