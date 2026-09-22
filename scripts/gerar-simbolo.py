"""Gera o simbolo da marca como geometria vetorial.

Tres prismas de quartzo rosa a sair de duas petalas. Cada prisma e construido
a partir do eixo, da meia-largura e das alturas, para que as facetas fechem
sempre sem folgas. A luz vem toda do mesmo lado, superior direito: a faceta
esquerda fica em sombra, a central em meio-tom, a direita apanha o claro e a
faceta direita da terminacao apanha o brilho.
"""

BRILHO   = '#ffe1e6'
CLARO    = '#ffc9d2'
MEIO     = '#ffb4c0'
SOMBRA   = '#f0909f'
PETALA   = '#f7889b'
PETALA_S = '#e5697f'


def prisma(eixo, meia, y_ombro, y_apice, y_base, inclinacao=0.0, rodar=0.0):
    """Devolve as facetas de um prisma. `rodar` inclina-o todo em torno da
    base: e a inclinacao do prisma inteiro, nao so do apice, que faz os
    cristais abrirem em leque em vez de ficarem colunas a prumo."""
    x0 = eixo - meia
    x1 = eixo - meia * 0.34
    x2 = eixo + meia * 0.34
    x3 = eixo + meia
    ax = eixo + inclinacao
    y_ext = y_ombro + meia * 0.34  # os cantos exteriores do ombro descaem
    g = f' transform="rotate({rodar} {eixo} {y_base})"' if rodar else ''

    return g, [
        (f'M{x0} {y_ext}L{x1} {y_ombro}L{x1} {y_base}L{x0} {y_base}Z', SOMBRA),
        (f'M{x1} {y_ombro}L{x2} {y_ombro}L{x2} {y_base}L{x1} {y_base}Z', MEIO),
        (f'M{x2} {y_ombro}L{x3} {y_ext}L{x3} {y_base}L{x2} {y_base}Z', CLARO),
        (f'M{x0} {y_ext}L{x1} {y_ombro}L{ax} {y_apice}Z', SOMBRA),
        (f'M{x1} {y_ombro}L{x2} {y_ombro}L{ax} {y_apice}Z', CLARO),
        (f'M{x2} {y_ombro}L{x3} {y_ext}L{ax} {y_apice}Z', BRILHO),
    ]


def petala(raiz, tip, c1, c2, c3, c4, cor):
    """Petala cheia: sai da raiz, incha de um lado ate a ponta e volta pelo
    outro. Os quatro controlos e que lhe dao o corpo; sem eles fica um risco."""
    rx, ry = raiz
    tx, ty = tip
    return (f'M{rx} {ry}C{c1[0]} {c1[1]} {c2[0]} {c2[1]} {tx} {ty}'
            f'C{c3[0]} {c3[1]} {c4[0]} {c4[1]} {rx} {ry}Z', cor)


# Os laterais sao desenhados antes e sobrepoem-se ao central, que fecha em cima.
# As bases descem abaixo da linha das petalas de proposito: sao elas que as
# tapam, e e essa sobreposicao que faz os cristais nascerem da flor em vez de
# assentarem nela.
formas = [
    prisma(eixo=41, meia=17, y_ombro=78, y_apice=34, y_base=154, rodar=-15),
    prisma(eixo=81, meia=14, y_ombro=96, y_apice=62, y_base=154, rodar=13),
    prisma(eixo=60, meia=19, y_ombro=56, y_apice=10, y_base=154),
]

# As petalas vem por cima e comem a base dos cristais.
petalas = [
    petala(raiz=(62, 116), tip=(14, 168),
           c1=(42, 116), c2=(12, 138), c3=(22, 178), c4=(58, 152), cor=PETALA_S),
    petala(raiz=(58, 116), tip=(104, 160),
           c1=(80, 112), c2=(108, 130), c3=(96, 174), c4=(62, 150), cor=PETALA),
]

corpo = '\n'.join(
    '  <g%s>\n%s\n  </g>' % (g, '\n'.join(f'    <path d="{d}" fill="{c}"/>' for d, c in fs))
    for g, fs in formas
)
base  = '\n'.join(f'  <path d="{d}" fill="{c}"/>' for d, c in petalas)

svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 176" '
       f'role="img" aria-label="Pétalas de Sonho">\n{corpo}\n{base}\n</svg>\n')
open('public/marca/simbolo.svg', 'w').write(svg)
print(len(svg), 'bytes')

# ---------------------------------------------------------------------------
# Variante compacta.
#
# A marca completa tem tres cristais e duas petalas; abaixo de uns 32px isso
# vira uma mancha. Aqui fica um cristal so, mais largo, com as duas petalas
# simplificadas. E a mesma ideia com menos informacao, nao outro desenho.

compacto_g, compacto_f = prisma(
    eixo=60, meia=30, y_ombro=62, y_apice=12, y_base=150,
)
compacto_petalas = [
    petala(raiz=(64, 120), tip=(12, 164),
           c1=(40, 122), c2=(10, 138), c3=(24, 178), c4=(58, 150), cor=PETALA_S),
    petala(raiz=(56, 120), tip=(108, 158),
           c1=(82, 118), c2=(112, 132), c3=(98, 176), c4=(62, 148), cor=PETALA),
]

svg_c = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 176" '
    'role="img" aria-label="Pétalas de Sonho">\n'
    + '\n'.join(f'  <path d="{d}" fill="{c}"/>' for d, c in compacto_f) + '\n'
    + '\n'.join(f'  <path d="{d}" fill="{c}"/>' for d, c in compacto_petalas)
    + '\n</svg>\n'
)
open('public/marca/simbolo-compacto.svg', 'w').write(svg_c)
print('compacto', len(svg_c), 'bytes')
