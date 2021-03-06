"""
Concatenates all js files from specified directory to the single js file.
Usage example:
concatenate_js.py C:\js_source_dir C:\concatenated_file.js
"""
import sys
import os

def create_file(source_dir, target_file_path):
    lines = []
    os.path.walk(source_dir, add, lines)
    concatenated_file = open(target_file_path, 'w')
    concatenated_file.writelines(lines)
    concatenated_file.close()

def add(lines, dir, names):
    #sorting for concatenation in correct order:
    #namespace declaration goes first
    names.sort(key=lambda file: 0 if file == 'namespace.js' else 1)
    for name in names:
        path = os.path.join(dir, name)
        if os.path.isfile(path):
            extension = os.path.splitext(path)[1]
            if extension == '.js':
                file = open(path, 'r')
                lines.extend(file.readlines())
                lines.append('\n\n')
                file.close()

if __name__ == '__main__':
    create_file(sys.argv[1], sys.argv[2])