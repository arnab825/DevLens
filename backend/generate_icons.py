import zlib
import struct
import os

def create_png(filename, size, color_bg=(24, 24, 27), color_fg=(59, 130, 246)):
    width = size
    height = size
    raw_data = bytearray()
    
    center = size / 2.0
    radius = size * 0.42
    inner_radius = size * 0.28
    
    for y in range(height):
        raw_data.append(0)  # Filter type none
        for x in range(width):
            dx = x - center
            dy = y - center
            dist = (dx*dx + dy*dy) ** 0.5
            
            # Lens circle border
            if inner_radius <= dist <= radius:
                # Cyan/Blue lens ring
                raw_data.extend([59, 130, 246, 255])
            elif dist < inner_radius:
                # Center pupil
                if dist < size * 0.12:
                    raw_data.extend([96, 165, 250, 255])
                else:
                    raw_data.extend([15, 23, 42, 255])
            else:
                # Background
                raw_data.extend([0, 0, 0, 0])
                
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff)

    png = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    png += chunk(b"IHDR", ihdr)
    compressed = zlib.compress(bytes(raw_data))
    png += chunk(b"IDAT", compressed)
    png += chunk(b"IEND", b"")
    
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, "wb") as f:
        f.write(png)

if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(__file__), "..", "extension", "icons")
    create_png(os.path.join(out_dir, "icon16.png"), 16)
    create_png(os.path.join(out_dir, "icon48.png"), 48)
    create_png(os.path.join(out_dir, "icon128.png"), 128)
    print("Extension icons generated successfully.")
