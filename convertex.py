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
        definiciones.append(f'"{col}" {tipo}')
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
        df = pd.read_excel(archivo_excel, engine='openpyxl')
    except Exception as e:
        print(f"⚠️ Error al leer el archivo Excel: {e}")
        sys.exit(1)

    # Convertir a CSV
    nombre_csv = os.path.splitext(archivo_excel)[0] + '.csv'
    df.to_csv(nombre_csv, index=False, sep=',')

    # Generar SQL
    nombre_tabla = os.path.splitext(os.path.basename(archivo_excel))[0].lower()
    sql = generar_create_table(df, nombre_tabla)

    print(f"✅ Archivo CSV generado: {nombre_csv}")
    print("\n📜 Instrucción SQL:")
    print(sql)

if __name__ == "__main__":
    main()  