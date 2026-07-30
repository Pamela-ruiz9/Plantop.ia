-- supabase/migrations/0003_plant_catalog_seed.sql

INSERT INTO plant_catalog
  (common_name, popular_name, scientific_name, plant_type, origin, description,
   light_type, light_hours_per_day, humidity, watering_frequency_days,
   substrate_mix, substrate_ph_min, substrate_ph_max, fertilizing_frequency_days,
   min_temperature_celsius, care_difficulty, toxic_to_pets, toxic_to_children,
   flowering_season, adult_size, location)
VALUES
  ('Costilla de Adán','Monstera','Monstera deliciosa','tropical','México y América Central',
   'Icónica planta tropical de hojas grandes con fenestración característica.',
   'bright_indirect',6,'medium',10,'tierra negra + perlita 30%',5.5,7.0,30,12,'medium',true,true,'year_round','large','indoor'),

  ('Teléfono','Teléfono','Monstera adansonii','tropical','América del Sur',
   'Trepadora de hojas perforadas, perfecta para colgar o guiar en tutor.',
   'bright_indirect',6,'medium',7,'tierra negra + perlita + fibra de coco',5.5,7.0,21,12,'medium',true,true,'year_round','medium','indoor'),

  ('Poto Dorado','Poto','Epipremnum aureum','trepadora','Islas Salomón',
   'Trepadora resistente, tolera poca luz y el descuido. Ideal para principiantes.',
   'low_indirect',4,'medium',7,'tierra universal',6.0,6.5,30,10,'easy',true,true,'none','large','indoor'),

  ('Cuna de Moisés','Lirio de Paz','Spathiphyllum wallisii','tropical','América Central y del Sur',
   'Purificadora de aire con flores blancas. Tolera poca luz.',
   'low_indirect',4,'high',7,'tierra negra + perlita 20%',5.5,6.5,30,15,'easy',true,false,'year_round','medium','indoor'),

  ('Lengua de Suegra','Sanseviera','Sansevieria trifasciata','tropical','África Occidental',
   'Extremadamente resistente. Tolera desde pleno sol hasta sombra profunda.',
   'bright_indirect',4,'low',14,'sustrato de cactus + perlita',5.5,7.0,60,10,'easy',true,false,'none','medium','indoor'),

  ('ZZ Plant','Zamioculca','Zamioculcas zamiifolia','tropical','África Oriental',
   'Casi indestructible. Almacena agua en sus rizomas, ideal para viajeros.',
   'low_indirect',4,'low',14,'tierra universal + perlita',6.0,7.0,60,10,'easy',true,false,'none','medium','indoor'),

  ('Ficus Lira',NULL,'Ficus lyrata','árbol','África Occidental',
   'Árbol de interior de moda. Sensible a cambios de ubicación y corrientes.',
   'bright_indirect',7,'medium',10,'tierra negra + corteza + perlita',6.0,7.0,30,15,'hard',false,false,'none','large','indoor'),

  ('Ficus Benjamina','Ficus','Ficus benjamina','árbol','Asia y Australia',
   'Árbol clásico de interior. Pierde hojas si se mueve o hay corrientes.',
   'bright_indirect',6,'medium',7,'tierra negra + perlita',6.0,6.5,30,13,'medium',false,false,'none','large','indoor'),

  ('Dracena','Árbol Dragón','Dracaena marginata','árbol','Madagascar',
   'Resistente y elegante. Sus hojas rojas la hacen decorativa.',
   'bright_indirect',6,'low',10,'tierra negra + perlita',6.0,7.0,30,10,'easy',true,false,'none','large','indoor'),

  ('Calatea','Calatea','Calathea ornata','tropical','Colombia y Venezuela',
   'Hojas pintadas a mano. Exige alta humedad, se ofende fácil.',
   'low_indirect',4,'high',7,'tierra negra + turba',6.0,6.5,30,15,'hard',false,false,'none','medium','indoor'),

  ('Maranta','Planta Orante','Maranta leuconeura','tropical','Brasil',
   'Sus hojas se pliegan de noche como manos orando. No tóxica.',
   'low_indirect',4,'high',7,'tierra negra + perlita',6.0,6.5,30,15,'medium',false,false,'none','compact','indoor'),

  ('Anturio','Anturio','Anthurium andraeanum','tropical','Colombia y Ecuador',
   'Flores brillantes de larga duración. Necesita alta humedad.',
   'bright_indirect',6,'high',7,'orquídea + perlita + tierra negra',5.5,6.5,30,16,'medium',true,false,'year_round','medium','indoor'),

  ('Áloe Vera','Sábila','Aloe vera','suculenta','Arabia y norte de África',
   'Gel cicatrizante en sus hojas. Odia el exceso de riego.',
   'direct',7,'low',14,'sustrato de cactus + perlita 30%',7.0,8.5,90,5,'easy',true,false,'summer','medium','both'),

  ('Echeveria','Suculenta Rosa','Echeveria spp.','suculenta','México',
   'Roseta perfecta. Necesita mucha luz para mantener su forma compacta.',
   'direct',6,'low',14,'sustrato de cactus + grava',6.0,7.0,90,0,'easy',false,false,'spring','compact','both'),

  ('Árbol de Jade','Jade','Crassula ovata','suculenta','Sudáfrica',
   'Suculenta arbustiva que puede vivir décadas. Símbolo de buena suerte.',
   'direct',5,'low',14,'sustrato de cactus + perlita',6.0,7.0,60,5,'easy',true,false,'winter','medium','indoor'),

  ('Haworthia','Suculenta Rayadita','Haworthia spp.','suculenta','Sudáfrica',
   'Tolera la sombra mejor que otras suculentas. Perfecta para escritorios.',
   'bright_indirect',4,'low',14,'sustrato de cactus + perlita',6.0,7.0,90,5,'easy',false,false,'none','compact','indoor'),

  ('Calanchoe','Calanchoe','Kalanchoe blossfeldiana','suculenta','Madagascar',
   'Floración abundante y colorida. Fácil de cuidar y reflorar.',
   'direct',6,'low',10,'sustrato de cactus + tierra negra',6.0,7.0,30,10,'easy',true,false,'winter','compact','indoor'),

  ('Gasteria','Lengüita','Gasteria spp.','suculenta','Sudáfrica',
   'Prima de la haworthia. Más resistente a la sombra y el olvido.',
   'bright_indirect',4,'low',14,'sustrato de cactus + perlita',6.0,7.0,90,5,'easy',false,false,'spring','compact','indoor'),

  ('Sedum','Sedum','Sedum spp.','suculenta','México y América del Norte',
   'Género enorme de suculentas. La mayoría prospera con sol y poco riego.',
   'direct',6,'low',14,'sustrato de cactus + grava',6.0,7.0,90,-10,'easy',false,false,'summer','compact','both'),

  ('Helecho de Boston','Helecho','Nephrolepis exaltata','helecho','América tropical',
   'Purificador de aire clásico. Pide mucha humedad ambiental.',
   'bright_indirect',5,'high',3,'tierra negra + turba + perlita',5.5,6.5,30,10,'medium',false,false,'none','medium','indoor'),

  ('Helecho Nido de Pájaro','Nido de Pájaro','Asplenium nidus','helecho','Asia tropical',
   'Hojas enteras sin división, más tolerante que otros helechos.',
   'low_indirect',4,'high',5,'tierra negra + turba',5.0,6.0,30,15,'medium',false,false,'none','medium','indoor'),

  ('Tradescantia','Amor de Hombre','Tradescantia zebrina','tropical','México y América Central',
   'Crecimiento rápido con hojas moradas metálicas. Fácil de propagar.',
   'bright_indirect',6,'medium',7,'tierra universal',6.0,6.5,30,5,'easy',true,false,'year_round','compact','indoor'),

  ('Aglaonema','Aglaonema','Aglaonema spp.','tropical','Asia tropical',
   'Follaje colorido. Una de las más tolerantes a poca luz de su familia.',
   'low_indirect',4,'medium',10,'tierra negra + perlita',6.0,7.0,30,13,'easy',true,false,'none','medium','indoor'),

  ('Diefenbaquia','Caña Muda','Dieffenbachia spp.','tropical','América tropical',
   'Hojas grandes decorativas. MUY tóxica — puede causar imposibilidad de hablar.',
   'bright_indirect',5,'medium',7,'tierra negra + perlita',6.0,7.0,30,15,'easy',true,true,'none','medium','indoor'),

  ('Filodendro Corazón','Filodendro','Philodendron hederaceum','trepadora','América tropical',
   'Hojas en forma de corazón. Trepadora o colgante muy resistente.',
   'bright_indirect',5,'medium',7,'tierra negra + perlita',5.5,7.0,30,12,'easy',true,false,'none','large','indoor'),

  ('Singonio','Planta Flecha','Syngonium podophyllum','trepadora','América tropical',
   'Hojas en flecha que cambian de forma al madurar. Trepadora compacta.',
   'bright_indirect',4,'medium',7,'tierra negra + perlita',5.5,6.5,30,15,'easy',true,false,'none','medium','indoor'),

  ('Hiedra','Hiedra','Hedera helix','trepadora','Europa y Asia',
   'Clásica trepadora de exterior que aguanta muy bien en interior.',
   'bright_indirect',5,'medium',7,'tierra universal',6.0,7.5,30,0,'easy',true,false,'none','large','both'),

  ('Schefflera','Árbol Paraguas','Schefflera arboricola','árbol','Asia tropical',
   'Hojas agrupadas como paraguas. Resistente y de rápido crecimiento.',
   'bright_indirect',6,'medium',7,'tierra negra + perlita',6.0,7.0,30,13,'easy',true,false,'none','large','indoor'),

  ('Pachira','Árbol del Dinero','Pachira aquatica','árbol','América Central',
   'Tronco trenzado característico. Símbolo de prosperidad en feng shui.',
   'bright_indirect',6,'medium',7,'tierra negra + arena',6.0,7.0,30,15,'easy',false,false,'none','large','indoor'),

  ('Pata de Elefante','Pata de Elefante','Beaucarnea recurvata','árbol','México',
   'Almacena agua en su tronco abultado. Extremadamente resistente al olvido.',
   'direct',7,'low',21,'sustrato de cactus + arena',6.0,7.0,60,10,'easy',false,false,'none','xlarge','indoor'),

  ('Yuca','Yuca','Yucca elephantipes','árbol','México y América Central',
   'Resistente, de porte erguido. Tolera el sol directo y sequía.',
   'direct',7,'low',14,'sustrato de cactus + tierra negra',6.0,7.0,60,5,'easy',true,false,'summer','xlarge','both'),

  ('Mamillaria','Cactus Botón','Mammillaria spp.','cactus','México',
   'Género de cactus más popular. Corona de flores pequeñas en primavera.',
   'direct',7,'low',14,'sustrato de cactus + grava',6.0,7.0,90,-5,'easy',false,false,'spring','compact','both'),

  ('Cereus','Cactus Columnar','Cereus peruvianus','cactus','América del Sur',
   'Columna azul-verde que puede crecer varios metros. Muy resistente.',
   'direct',7,'low',14,'sustrato de cactus + grava',6.0,7.0,90,5,'easy',false,false,'summer','xlarge','both'),

  ('Nopal',NULL,'Opuntia spp.','cactus','México',
   'Cactus paleta nativo de México. Fruta y nopales comestibles.',
   'direct',7,'low',14,'sustrato de cactus + arena',6.0,7.5,90,-10,'easy',false,false,'spring','large','outdoor'),

  ('Palmera de Salón','Palmita','Chamaedorea elegans','tropical','México y Guatemala',
   'Palma compacta ideal para interiores. No tóxica para mascotas.',
   'bright_indirect',4,'medium',7,'tierra negra + perlita',6.0,7.0,30,10,'easy',false,false,'none','medium','indoor'),

  ('Ripsalis','Cactus Colgante','Rhipsalis spp.','cactus','Bosques tropicales de América',
   'Cactus epífito de selva. No necesita sol directo, ideal colgante.',
   'bright_indirect',5,'medium',7,'mezcla de orquídea + tierra negra',5.5,6.5,30,10,'easy',false,false,'winter','medium','indoor'),

  ('Peperomia','Radiadora','Peperomia obtusifolia','tropical','América tropical',
   'Planta compacta de bajo mantenimiento. Miles de variedades disponibles.',
   'bright_indirect',4,'low',10,'tierra universal + perlita',6.0,7.0,30,10,'easy',false,false,'none','compact','indoor'),

  ('Ave del Paraíso',NULL,'Strelitzia reginae','tropical','Sudáfrica',
   'Flores espectaculares en naranja y azul. Necesita sol directo para florecer.',
   'direct',7,'medium',7,'tierra negra + arena',6.0,7.0,30,5,'medium',true,false,'spring','large','both'),

  ('Crotón','Crotón','Codiaeum variegatum','tropical','Malasia y Oceanía',
   'Hojas multicolores explosivas. Odia los cambios y los ambientes secos.',
   'direct',7,'high',7,'tierra negra + perlita',5.5,6.5,30,15,'hard',true,false,'none','medium','indoor'),

  ('Alocasia','Oreja de Elefante','Alocasia spp.','tropical','Asia tropical',
   'Hojas enormes en forma de corazón o flecha. Impacto visual garantizado.',
   'bright_indirect',6,'high',7,'tierra negra + perlita + corteza',5.5,7.0,30,15,'medium',true,false,'none','large','indoor'),

  ('Bromelia','Bromelia','Bromeliaceae spp.','tropical','América tropical',
   'Forma roseta con copa central que retiene agua. Floración única en su vida.',
   'bright_indirect',6,'medium',7,'mezcla de orquídea + corteza',5.5,6.5,30,15,'medium',false,false,'year_round','medium','indoor'),

  ('Albahaca',NULL,'Ocimum basilicum','otra','India y Asia tropical',
   'Hierba aromática imprescindible en la cocina. Pide sol y agua frecuente.',
   'direct',7,'medium',3,'tierra negra + compost',6.0,7.0,30,10,'medium',false,false,'summer','compact','both'),

  ('Menta',NULL,'Mentha spp.','otra','Europa y Asia',
   'Aromática invasiva. Mejor en maceta propia para controlar su expansión.',
   'bright_indirect',5,'medium',3,'tierra negra + compost',6.0,7.0,30,0,'easy',false,false,'summer','compact','both'),

  ('Romero',NULL,'Salvia rosmarinus','otra','Mediterráneo',
   'Arbusto aromático resistente. Odia los suelos con humedad estancada.',
   'direct',7,'low',7,'tierra universal + arena',6.0,8.0,60,-5,'easy',false,false,'spring','medium','outdoor'),

  ('Lavanda',NULL,'Lavandula angustifolia','otra','Mediterráneo',
   'Flores perfumadas que repelen mosquitos. Necesita sol y buen drenaje.',
   'direct',7,'low',7,'tierra universal + arena',6.5,8.0,60,-10,'medium',false,false,'summer','medium','outdoor'),

  ('Tomillo',NULL,'Thymus vulgaris','otra','Mediterráneo',
   'Hierba culinaria compacta muy resistente. Sol y poco riego.',
   'direct',6,'low',7,'tierra universal + arena',6.0,8.0,60,-10,'easy',false,false,'spring','compact','outdoor');
