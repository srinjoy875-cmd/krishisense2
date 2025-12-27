import os
import glob

def rejoin_files():
    # Find all .part0 files
    part_files = glob.glob("*.part0")
    
    for first_part in part_files:
        base_name = first_part.replace(".part0", "")
        print(f"Rejoining {base_name}...")
        
        with open(base_name, 'wb') as outfile:
            part_num = 0
            while True:
                part_name = f"{base_name}.part{part_num}"
                if not os.path.exists(part_name):
                    break
                    
                print(f"  Adding {part_name}")
                with open(part_name, 'rb') as infile:
                    outfile.write(infile.read())
                
                # Cleanup part file
                os.remove(part_name)
                part_num += 1
        
        print(f"Completed {base_name}")

if __name__ == "__main__":
    rejoin_files()
