import pandas as pd
import sys
import os

def inferir_tipo(columna):
    if pd.api.types.is_integer_dtype(columna):
        return 'INTEGER'
    elif pd.api.types.is_bool_dtype(columna):
        return 'BOOLEAN'
    elif pd.api.types.is_datetime64_any_dtype(columna):
        return 'TIMESTAMP'
    else:
        return 'TEXT'

def generar_create_table(df, nombre_tabla):
    definiciones = []
    for col in df.columns:
        tipo = inferir_tipo(df[col])
        # Aseguramos que los nombres de las columnas en la instrucción SQL
        # sean seguros (sin caracteres especiales que rompan la sintaxis)
        col_limpia = col.replace('.', '_').replace(' ', '_').replace('-', '_').lower()
        definiciones.append(f'"{col_limpia}" {tipo}')
    sql = f'CREATE TABLE {nombre_tabla} (\n    ' + ',\n    '.join(definiciones) + '\n);'
    return sql

def main():
    if len(sys.argv) != 2:
        print("❌ Uso: python convertex.py archivo.xlsx")
        sys.exit(1)

    archivo_excel = sys.argv[1]

    if not os.path.exists(archivo_excel):
        print(f"❌ El archivo '{archivo_excel}' no existe.")
        sys.exit(1)

    try:
        # Lee el archivo Excel. Aunque .xlsx usa su propia codificación,
        # es una buena práctica estar preparado.
        df = pd.read_excel(archivo_excel, engine='openpyxl')
    except Exception as e:
        print(f"⚠️ Error al leer el archivo Excel: {e}")
        sys.exit(1)

    # Convertir a CSV con codificación UTF-8
    nombre_csv = os.path.splitext(archivo_excel)[0] + '.csv'
    try:
        df.to_csv(nombre_csv, index=False, sep=',', encoding='utf-8')
    except Exception as e:
        print(f"⚠️ Error al escribir el archivo CSV con UTF-8: {e}")
        sys.exit(1)

    # Generar SQL
    nombre_tabla = os.path.splitext(os.path.basename(archivo_excel))[0].lower()
    sql = generar_create_table(df, nombre_tabla)

    print(f"✅ Archivo CSV generado: {nombre_csv}")
    print("\n📜 Instrucción SQL:")
    print(sql)

if __name__ == "__main__":
    main()