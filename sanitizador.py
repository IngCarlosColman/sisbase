import sys
import os

def sanitize_file(file_path):
    """
    Lee un archivo, elimina caracteres ocultos y no válidos, y sobrescribe
    el archivo con el contenido limpio.

    Args:
        file_path (str): La ruta al archivo que se va a sanitizar.
    """
    # Lista completa de caracteres a eliminar.
    # Se han agregado los caracteres más comunes que causan problemas en el código.
    characters_to_remove = [
        # Espacios no-separadores y de ancho cero. Muy comunes.
        '\xa0',  # Espacio de no-separación (non-breaking space)
        '\u200b', # Espacio de ancho cero (zero-width space)
        '\u200c', # No-joiner de ancho cero (zero-width non-joiner)
        '\u200d', # Joiner de ancho cero (zero-width joiner)
        
        # Marcadores de byte.
        '\ufeff', # Marca de orden de bytes (BOM - Byte Order Mark)
        
        # Saltos de línea y retornos de carro.
        '\r',    # Retorno de carro (Carriage return)
        
        # Otros caracteres de control y nulos.
        '\x00',  # Carácter nulo
        '\x0b',  # Tabulador vertical
        '\x0c',  # Salto de página (Form feed)
        '\x1a',  # Sustituto
        '\x1b',  # Escape
    ]

    # Asegurarse de que el archivo existe
    if not os.path.exists(file_path):
        print(f"Error: No se encontró el archivo en la ruta '{file_path}'")
        return

    try:
        # 1. Leer el contenido del archivo
        print(f"Leyendo el archivo: {file_path}")
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()

        # 2. Reemplazar cada carácter no deseado
        print("Sanitizando el contenido...")
        clean_content = content
        for char in characters_to_remove:
            clean_content = clean_content.replace(char, '')

        # 3. Escribir el contenido limpio de vuelta al archivo
        print(f"Escribiendo el contenido limpio de vuelta a: {file_path}")
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(clean_content)

        print("¡El archivo ha sido sanitizado con éxito!")

    except IOError as e:
        print(f"Error de E/S: {e}")
    except Exception as e:
        print(f"Ocurrió un error inesperado: {e}")


# --- MODO DE USO DESDE LA LÍNEA DE COMANDOS ---

# Comprobar si se proporcionó un argumento de línea de comandos
if len(sys.argv) < 2:
    print("Uso: python sanitizador.py <ruta_del_archivo>")
    print("Ejemplo: python sanitizador.py backend/routes/personas.js")
    sys.exit(1) # Salir con un código de error

# Obtener la ruta del archivo desde el primer argumento
file_to_clean = sys.argv[1]

# Llamar a la función para ejecutar el proceso de limpieza
sanitize_file(file_to_clean)
