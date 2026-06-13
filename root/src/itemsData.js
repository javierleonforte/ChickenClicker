export const getItemsData = (lang) => {
  const nombres = lang.items;

  return nombres.map((nombre, index) => {
    const isClick = index % 5 === 0;
    const tier = Math.floor(index / 20) + 1;

    const multiplicadorCosto = 1.6 + (index * 0.005);
    const baseCosto = Math.floor(10 * Math.pow(multiplicadorCosto, index));
    const basePoder = Math.floor(1 * Math.pow(1.42, index));

    const desc = isClick
      ? `${lang.descClick} +${basePoder === 0 ? 1 : basePoder}.`
      : `${lang.descCps} +${basePoder === 0 ? 1 : basePoder} ${lang.descCpsSufijo}`;

    // Carga dinámica de imágenes por etapa
    let imagenes = { basico: null, avanzado: null, maestro: null };
    imagenes = {
  basico:   `${process.env.PUBLIC_URL}/assets/items/item_${index}/basico.png`,
  avanzado: `${process.env.PUBLIC_URL}/assets/items/item_${index}/avanzado.png`,
  maestro:  `${process.env.PUBLIC_URL}/assets/items/item_${index}/maestro.png`,
  };

    return {
      id: `item_${index}`,
      nombre,
      desc,
      baseCosto: baseCosto === 0 ? 10 : baseCosto,
      basePoder: basePoder === 0 ? 1 : basePoder,
      tipo: isClick ? 'click' : 'cps',
      tier,
      imagenes,
    };
  });
};