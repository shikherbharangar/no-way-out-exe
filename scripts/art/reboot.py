"""Publish reviewed editable PNG masters. Never re-import over pixel edits."""
from pathlib import Path
from shutil import copyfile

def generate(out):
    root=Path(__file__).resolve().parents[2]/'art/reboot/editable'
    for source in root.glob('*.png'):
        if not source.stem.endswith('-keys'):
            copyfile(source,out/('reboot-'+source.name))

if __name__=='__main__':
    generate(Path(__file__).resolve().parents[2]/'public/assets')
