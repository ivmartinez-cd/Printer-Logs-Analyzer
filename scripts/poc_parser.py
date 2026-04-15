import pandas as pd
import re

def parse_ekm_response():
    print("[*] Abriendo la muestra descargada desde la API de Insight Portal...")
    with open("hp_respuesta_muestra.html", "r", encoding="utf-8") as f:
        content = f.read()

    # La API de EKM/HP SDS envuelve el HTML de la tabla en una etiqueta <content><![CDATA[ ... ]]></content>
    # Usamos una expresión regular para sacar solo el HTML puro
    match = re.search(r"<content><!\[CDATA\[(.*?)\]\]></content>", content, re.DOTALL)
    
    if match:
        html_table = match.group(1)
        print("[+] HTML dinámico extraído limpiamente de la cápsula XML.")
        
        try:
            # Pandas es excelente convirtiendo <table> de HTML a DataFrames
            dfs = pd.read_html(html_table)
            df = dfs[0] # Tomamos la tabla generada
            
            print(f"[+] ¡Conversión exitosa! Se encontraron {len(df)} eventos registrados.")
            
            # Rellenar valores nulos (NaN) para que se vea estético
            df = df.fillna("")
            
            print("\n[Vista Previa de los 5 eventos más recientes]")
            print("-" * 75)
            print(df.head().to_string(index=False))
            print("-" * 75)
            
            # Exportar la tabla estructurada a formato CSV
            csv_filename = "eventos_dispositivo_239877.csv"
            df.to_csv(csv_filename, index=False, encoding="utf-8-sig")
            print(f"\n[+] Proceso Terminado: Archivo guardado y listo para usar en: '{csv_filename}'")
            
        except ImportError:
             print("[-] Error: Te falta instalar 'lxml' o 'beautifulsoup4' para que Pandas pueda leer HTML. Ejecuta: pip install lxml")
        except Exception as e:
             print(f"[-] Ocurrió un error leyendo la tabla: {e}")
             
    else:
        print("[-] No se detectó la etiqueta de contenido esperado.")

if __name__ == "__main__":
    parse_ekm_response()
