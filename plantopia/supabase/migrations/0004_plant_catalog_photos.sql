-- supabase/migrations/0004_plant_catalog_photos.sql
-- Agrega fotos de referencia a las entradas del catálogo (Wikimedia Commons, licencia libre)

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Monstera_deliciosa2.jpg/960px-Monstera_deliciosa2.jpg'
  WHERE scientific_name = 'Monstera deliciosa';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Monstera_adansonii_79319231.jpg/960px-Monstera_adansonii_79319231.jpg'
  WHERE scientific_name = 'Monstera adansonii';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Money_Plant_%28Epipremnum_aureum%29_4.jpg/960px-Money_Plant_%28Epipremnum_aureum%29_4.jpg'
  WHERE scientific_name = 'Epipremnum aureum';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Peace_lily_-_1_-_cropped.jpg/960px-Peace_lily_-_1_-_cropped.jpg'
  WHERE scientific_name = 'Spathiphyllum wallisii';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Snake_Plant_%28Sansevieria_trifasciata_%27Laurentii%27%29.jpg/960px-Snake_Plant_%28Sansevieria_trifasciata_%27Laurentii%27%29.jpg'
  WHERE scientific_name = 'Sansevieria trifasciata';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Zamioculcas_zamiifolia_1.jpg/960px-Zamioculcas_zamiifolia_1.jpg'
  WHERE scientific_name = 'Zamioculcas zamiifolia';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Starr_031108-0130_Ficus_lyrata.jpg/960px-Starr_031108-0130_Ficus_lyrata.jpg'
  WHERE scientific_name = 'Ficus lyrata';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Starr-080608-7576-Ficus_benjamina-habit_with_Laysan_albatross-Gym_Sand_Island-Midway_Atoll_%2824823189861%29.jpg/960px-Starr-080608-7576-Ficus_benjamina-habit_with_Laysan_albatross-Gym_Sand_Island-Midway_Atoll_%2824823189861%29.jpg'
  WHERE scientific_name = 'Ficus benjamina';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Dracaena_reflexa.JPG/960px-Dracaena_reflexa.JPG'
  WHERE scientific_name = 'Dracaena marginata';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Starr_080716-9470_Calathea_crotalifera.jpg/960px-Starr_080716-9470_Calathea_crotalifera.jpg'
  WHERE scientific_name = 'Calathea ornata';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Maranta_leuconeura3.jpg'
  WHERE scientific_name = 'Maranta leuconeura';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/AnthuriumAndraenum.jpg/960px-AnthuriumAndraenum.jpg'
  WHERE scientific_name = 'Anthurium andraeanum';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Aloe_vera_flower_inset.png/960px-Aloe_vera_flower_inset.png'
  WHERE scientific_name = 'Aloe vera';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/8/85/Echeveria_elegans_-_1.jpg'
  WHERE scientific_name = 'Echeveria spp.';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Crassula_ovata_700.jpg'
  WHERE scientific_name = 'Crassula ovata';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Haworthia_cymbiformis_1.jpg/960px-Haworthia_cymbiformis_1.jpg'
  WHERE scientific_name = 'Haworthia spp.';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Kalanchoe_blossfeldiana_3.jpg/960px-Kalanchoe_blossfeldiana_3.jpg'
  WHERE scientific_name = 'Kalanchoe blossfeldiana';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Gasteria_pillansii_var_pillansii_1.jpg/960px-Gasteria_pillansii_var_pillansii_1.jpg'
  WHERE scientific_name = 'Gasteria spp.';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Sedum_acre_single_-_Niitv%C3%A4lja.jpg/960px-Sedum_acre_single_-_Niitv%C3%A4lja.jpg'
  WHERE scientific_name = 'Sedum spp.';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/3/30/Boston_Fern_%282873392811%29.png'
  WHERE scientific_name = 'Nephrolepis exaltata';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Asplenium_nidus_%28Bukidnon%2C_Philippines%29_02.jpg/960px-Asplenium_nidus_%28Bukidnon%2C_Philippines%29_02.jpg'
  WHERE scientific_name = 'Asplenium nidus';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Zebrina_pendula_20060521_2_closer.jpg'
  WHERE scientific_name = 'Tradescantia zebrina';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/0/07/Aglaonema_commutatum2.jpg'
  WHERE scientific_name = 'Aglaonema spp.';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Dieffenbachia_oerstedii_kz2.jpg/960px-Dieffenbachia_oerstedii_kz2.jpg'
  WHERE scientific_name = 'Dieffenbachia spp.';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Philodendron_scandens_subsp_oxycardium2.jpg'
  WHERE scientific_name = 'Philodendron hederaceum';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Syngonium_podophyllum_DPR.png/960px-Syngonium_podophyllum_DPR.png'
  WHERE scientific_name = 'Syngonium podophyllum';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Hedera_helix_Dover.jpg/960px-Hedera_helix_Dover.jpg'
  WHERE scientific_name = 'Hedera helix';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Schefflera_arboricola%2C_vrugte%2C_a%2C_Pretoria.jpg/960px-Schefflera_arboricola%2C_vrugte%2C_a%2C_Pretoria.jpg'
  WHERE scientific_name = 'Schefflera arboricola';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Flickr_-_archer10_%28Dennis%29_-_Guatemala-1376.jpg/960px-Flickr_-_archer10_%28Dennis%29_-_Guatemala-1376.jpg'
  WHERE scientific_name = 'Pachira aquatica';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Beaucarnea_recurvata%2C_Ocampo%2C_Tamaulipas%2C_Mexico_1.jpg'
  WHERE scientific_name = 'Beaucarnea recurvata';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Yucca_gigantea_-_Jard%C3%ADn_Bot%C3%A1nico_Canario_Viera_y_Clavijo_-_Gran_Canaria.jpg/960px-Yucca_gigantea_-_Jard%C3%ADn_Bot%C3%A1nico_Canario_Viera_y_Clavijo_-_Gran_Canaria.jpg'
  WHERE scientific_name = 'Yucca elephantipes';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Mammillaria_tayloriorum.jpg/960px-Mammillaria_tayloriorum.jpg'
  WHERE scientific_name = 'Mammillaria spp.';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Cereus_pierre-braunianus_Esteves_flowering_%2C_from_website_Eddie_Esteves_%28O_Paraiso%29.jpg'
  WHERE scientific_name = 'Cereus peruvianus';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Opuntia_littoralis_var_vaseyi_4.jpg/960px-Opuntia_littoralis_var_vaseyi_4.jpg'
  WHERE scientific_name = 'Opuntia spp.';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Chamaedorea_elegans_Mart.JPG/960px-Chamaedorea_elegans_Mart.JPG'
  WHERE scientific_name = 'Chamaedorea elegans';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Rhipsalis_cereuscula1PAKAL.jpg'
  WHERE scientific_name = 'Rhipsalis spp.';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Peperomia_obtusifolia_3-OB9.jpg/960px-Peperomia_obtusifolia_3-OB9.jpg'
  WHERE scientific_name = 'Peperomia obtusifolia';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Ave-do-para%C3%ADso%2C_Strelitzia_reginae%2C_em_Bag%C3%A9%2C_Rio_Grande_do_Sul%2C_Brasil_-_55211233712.jpg/960px-Ave-do-para%C3%ADso%2C_Strelitzia_reginae%2C_em_Bag%C3%A9%2C_Rio_Grande_do_Sul%2C_Brasil_-_55211233712.jpg'
  WHERE scientific_name = 'Strelitzia reginae';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Colpfl05.jpg/960px-Colpfl05.jpg'
  WHERE scientific_name = 'Codiaeum variegatum';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Alocasia_macrorrhiza_-_Val_Rahmeh_-_DSC04449.JPG/960px-Alocasia_macrorrhiza_-_Val_Rahmeh_-_DSC04449.JPG'
  WHERE scientific_name = 'Alocasia spp.';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/8/80/DirkvdM_red-white-stripe_flower.jpg'
  WHERE scientific_name = 'Bromeliaceae spp.';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Ocimum_basilicum_8zz.jpg/960px-Ocimum_basilicum_8zz.jpg'
  WHERE scientific_name = 'Ocimum basilicum';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Mentha_spicata-IMG_6186.jpg/960px-Mentha_spicata-IMG_6186.jpg'
  WHERE scientific_name = 'Mentha spp.';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Rosemary_in_bloom.JPG/960px-Rosemary_in_bloom.JPG'
  WHERE scientific_name = 'Salvia rosmarinus';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/4/40/Lavandula_angustifolia_-_K%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-087.jpg'
  WHERE scientific_name = 'Lavandula angustifolia';

UPDATE plant_catalog SET reference_photo_url = 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Thymus_vulgaris1.JPG'
  WHERE scientific_name = 'Thymus vulgaris';
