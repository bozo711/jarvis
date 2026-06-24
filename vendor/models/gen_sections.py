#!/usr/bin/env python3
# Headless Blender → one distinct GLB per JARVIS section.
# Run:  blender --background --python gen_sections.py
# Builds: brain.glb (NEUROLINK), vault.glb (Security), academy.glb (Teacher),
#         gears.glb (Settings).  PBR + emissive, on-brand red/gold/chrome.
import bpy, math, os
DIR = os.path.dirname(os.path.abspath(__file__))

def clear():
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
    for blk in (bpy.data.meshes, bpy.data.materials, bpy.data.textures):
        for b in list(blk): blk.remove(b)

def _set(b, names, val):
    for n in names:
        if n in b.inputs: b.inputs[n].default_value = val; return

def mat(name, base, metallic=0.0, rough=0.5, emission=None, emis=0.0, transmission=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    _set(b, ['Base Color'], (*base, 1)); _set(b, ['Metallic'], metallic); _set(b, ['Roughness'], rough)
    _set(b, ['Transmission Weight', 'Transmission'], transmission)
    if emission:
        _set(b, ['Emission Color', 'Emission'], (*emission, 1)); _set(b, ['Emission Strength'], emis)
    return m

def add(m):
    o = bpy.context.active_object; o.data.materials.append(m); return o

def smooth_all():
    for o in bpy.data.objects:
        if o.type == 'MESH':
            for p in o.data.polygons: p.use_smooth = True

def bevel_all():
    for o in bpy.data.objects:
        if o.type == 'MESH':
            m = o.modifiers.new('bev', 'BEVEL'); m.width = 0.012; m.segments = 2
            m.limit_method = 'ANGLE'; m.angle_limit = math.radians(35)

def export(name):
    bevel_all()
    smooth_all()
    out = os.path.join(DIR, name)
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_apply=True, export_yup=True)
    print("WROTE", out, os.path.getsize(out))

# ── BRAIN (NEUROLINK) ──────────────────────────────────────────────
clear()
FLESH = mat('flesh', (0.85, 0.30, 0.42), metallic=0.0, rough=0.55, emission=(0.7, 0.1, 0.2), emis=0.6)
SYN   = mat('syn',   (1.0, 0.3, 0.4),   emission=(1.0, 0.25, 0.4), emis=8.0)
for sx in (1, -1):  # two hemispheres
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4, radius=1.0, location=(sx*0.52, 0, 0))
    o = bpy.context.active_object; o.scale = (0.62, 1.05, 1.15)
    tex = bpy.data.textures.new('cl'+str(sx), type='CLOUDS'); tex.noise_scale = 0.30
    d = o.modifiers.new('d', 'DISPLACE'); d.texture = tex; d.strength = 0.22
    o.modifiers.new('s', 'SUBSURF').levels = 1
    add(FLESH)
for i in range(28):  # glowing synapse nodes floating around
    a = (i/28)*math.tau; r = 1.35 + (i % 3)*0.12
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.04,
        location=(math.cos(a)*r*0.7, math.sin(a*1.3)*0.9, math.sin(a)*r*0.6))
    add(SYN)
export('brain.glb')

# ── VAULT (Security) ───────────────────────────────────────────────
clear()
STEEL = mat('steel', (0.10, 0.10, 0.12), metallic=1.0, rough=0.22)
GOLD  = mat('vgold', (0.72, 0.52, 0.10), metallic=1.0, rough=0.25)
GLOW  = mat('vglow', (0.3, 0.0, 0.05), emission=(1.0, 0.15, 0.28), emis=4.0)
bpy.ops.mesh.primitive_cylinder_add(radius=1.4, depth=0.45, vertices=64); add(STEEL)          # door
bpy.ops.mesh.primitive_cylinder_add(radius=1.5, depth=0.30, vertices=64, location=(0,0,-0.1)); add(STEEL)  # frame
bpy.ops.mesh.primitive_torus_add(major_radius=0.5, minor_radius=0.09, location=(0,0,0.26)); add(GOLD)      # wheel
for i in range(4):  # wheel spokes
    a = i*math.pi/2
    bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=0.95, location=(0,0,0.26))
    o = bpy.context.active_object; o.rotation_euler = (math.pi/2, 0, a); add(GOLD)
for i in range(12):  # rim bolts
    a = (i/12)*math.tau
    bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=0.12, location=(math.cos(a)*1.2, math.sin(a)*1.2, 0.23)); add(GOLD)
bpy.ops.mesh.primitive_cylinder_add(radius=0.14, depth=0.5, vertices=32, location=(0,0,0.26)); add(GLOW)   # core glow
export('vault.glb')

# ── ACADEMY (Teacher) — graduation cap + floating books ────────────
clear()
DARK = mat('cap', (0.05, 0.04, 0.07), metallic=0.3, rough=0.5)
TASS = mat('tass', (0.78, 0.58, 0.12), metallic=1.0, rough=0.3, emission=(0.9, 0.6, 0.1), emis=1.2)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.4, 0)); o=bpy.context.active_object; o.scale=(1.5,0.04,1.5); add(DARK)  # board
bpy.ops.mesh.primitive_cylinder_add(radius=0.6, depth=0.45, vertices=32, location=(0,0.05,0)); add(DARK)     # head band
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.08, location=(0,0.46,0)); add(TASS)            # button
for i in range(6):  # tassel strands
    bpy.ops.mesh.primitive_cylinder_add(radius=0.012, depth=0.6, location=(0.55+i*0.012, 0.16, 0.0)); add(TASS)
BOOK = [mat('b0',(0.55,0.05,0.1),0.1,0.5), mat('b1',(0.1,0.2,0.5),0.1,0.5), mat('b2',(0.1,0.4,0.2),0.1,0.5)]
for i,bm in enumerate(BOOK):  # a small floating stack beside the cap
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.5, -0.5+i*0.16, 0))
    o=bpy.context.active_object; o.scale=(0.55,0.07,0.75); o.rotation_euler=(0,i*0.2,0); add(bm)
export('academy.glb')

# ── GEARS (Settings) — interlocking gears ──────────────────────────
clear()
CHR = mat('gchr', (0.12,0.12,0.14), metallic=1.0, rough=0.18)
GLD = mat('ggld', (0.72,0.52,0.10), metallic=1.0, rough=0.24)
def gear(R, teeth, depth, loc, m):
    bpy.ops.mesh.primitive_cylinder_add(radius=R, depth=depth, vertices=48, location=loc); add(m)
    bpy.ops.mesh.primitive_cylinder_add(radius=R*0.3, depth=depth*1.2, vertices=24, location=loc); add(m)  # hub
    for i in range(teeth):
        a = (i/teeth)*math.tau
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(loc[0]+math.cos(a)*R, loc[1]+math.sin(a)*R, loc[2]))
        o=bpy.context.active_object; o.scale=(0.16,0.16,depth*0.5); o.rotation_euler=(0,0,a); add(m)
gear(0.95, 14, 0.28, (0,0,0), CHR)
gear(0.62, 10, 0.24, (1.35, 0.55, 0.05), GLD)
gear(0.5, 8, 0.22, (-1.1, -0.7, -0.05), GLD)
export('gears.glb')
print("ALL SECTION MODELS DONE")
