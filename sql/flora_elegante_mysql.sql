

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- ROLES DE USUARIO
-- ============================================================
CREATE TABLE IF NOT EXISTS rol (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    nombre  VARCHAR(30) NOT NULL UNIQUE          -- 'cliente' | 'administrador'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO rol (nombre) VALUES ('cliente'), ('administrador')
ON DUPLICATE KEY UPDATE nombre = nombre;

-- ============================================================
-- USUARIOS Y CREDENCIALES
-- ============================================================
CREATE TABLE IF NOT EXISTS usuario (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(120) NOT NULL,       -- PUBLICO
    email           VARCHAR(160) NOT NULL UNIQUE,-- PUBLICO
    password_hash   VARCHAR(255) NOT NULL,       -- SENSIBLE: hash password_hash (nunca texto plano)
    rol_id          INT NOT NULL,
    activo          TINYINT(1) NOT NULL DEFAULT 1,
    fecha_registro  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso   DATETIME NULL,
    CONSTRAINT fk_usuario_rol FOREIGN KEY (rol_id) REFERENCES rol(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_usuario_rol ON usuario (rol_id);

-- ============================================================
-- PERFIL DEL CLIENTE (datos clasificados)
-- ============================================================
CREATE TABLE IF NOT EXISTS cliente_perfil (
    usuario_id            BIGINT PRIMARY KEY,
    telefono              VARCHAR(30) NULL,      -- SEMIPRIVADO
    direccion             TEXT NULL,             -- SEMIPRIVADO
    fecha_nacimiento      DATE NULL,             -- PRIVADO
    preferencias_florales VARCHAR(60) NULL,      -- PRIVADO
    identificacion        VARCHAR(40) NULL,      -- SENSIBLE (nunca se muestra al admin)
    metodo_pago           VARCHAR(40) NULL,      -- SENSIBLE (nunca se muestra al admin)
    actualizado_en        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_perfil_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- CATEGORIAS DE PRODUCTO
-- ============================================================
CREATE TABLE IF NOT EXISTS categoria (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(60) NOT NULL UNIQUE,    
    nombre_en   VARCHAR(60) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO categoria (nombre, nombre_en) VALUES
    ('rosas', 'Roses'),
    ('lirios', 'Lilies'),
    ('girasoles', 'Sunflowers'),
    ('tulipanes', 'Tulips'),
    ('orquideas', 'Orchids'),
    ('exoticas', 'Exotic')
ON DUPLICATE KEY UPDATE nombre_en = VALUES(nombre_en);

-- ============================================================
-- CATALOGO DE PRODUCTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS producto (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT NOT NULL,
    nombre       VARCHAR(120) NOT NULL,          -- PUBLICO
    nombre_en    VARCHAR(120) NOT NULL,          -- PUBLICO
    descripcion  TEXT NULL,                      -- PUBLICO
    descripcion_en TEXT NULL,                    -- PUBLICO
    precio       DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
    imagen_url   VARCHAR(300) NULL,
    stock        INT NOT NULL DEFAULT 0 CHECK (stock >= 0),   -- INVENTARIO
    estado       VARCHAR(20) NOT NULL DEFAULT 'activo',       -- 'activo' | 'inactivo'
    CONSTRAINT fk_producto_categoria FOREIGN KEY (categoria_id) REFERENCES categoria(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_producto_categoria ON producto (categoria_id);

INSERT INTO producto (categoria_id, nombre, nombre_en, descripcion, descripcion_en, precio, imagen_url, stock, estado) VALUES
    (1, 'Ramo de Rosas Rojas', 'Red Roses Bouquet', '12 rosas rojas premium con follaje verde y lazo de satén.', '12 premium red roses with green foliage and a satin ribbon.', 85000.00, 'img/rosas-rojas.jpg', 25, 'activo'),
    (2, 'Arreglo de Lirios Blancos', 'White Lilies Arrangement', 'Elegante composición de lirios blancos con eucalipto y baby breath.', 'Elegant arrangement of white lilies with eucalyptus and baby’s breath.', 98000.00, 'img/lirios-blancos.jpg', 3, 'activo'),
    (3, 'Canasta de Girasoles', 'Sunflower Basket', 'Vibrante canasta de girasoles frescos con flores de campo.', 'Vibrant basket of fresh sunflowers with wildflowers.', 72000.00, 'img/girasoles.jpg', 20, 'activo'),
    (4, 'Tulipanes Mixtos', 'Mixed Tulips', '20 tulipanes en tonos pastel: rosa, amarillo, lila y naranja.', '20 tulips in pastel tones: pink, yellow, lilac and orange.', 92000.00, 'img/tulipanes.jpg', 22, 'activo'),
    (6, 'Centro de Mesa Tropical', 'Tropical Centerpiece', 'Composición exótica con anturios, heliconias y hojas de palma.', 'Exotic composition with anthuriums, heliconias and palm leaves.', 118000.00, 'img/tropical.jpg', 10, 'activo'),
    (5, 'Caja de Orquídeas', 'Orchid Box', 'Tres orquídeas phalaenopsis en caja de madera premium con musgo.', 'Three phalaenopsis orchids in a premium wooden box with moss.', 145000.00, 'img/orquideas.jpg', 8, 'activo')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ============================================================
-- PEDIDOS
-- ============================================================
CREATE TABLE IF NOT EXISTS pedido (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    cliente_id  BIGINT NOT NULL,
    fecha       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado      VARCHAR(20) NOT NULL DEFAULT 'Confirmado',
    total       DECIMAL(12,2) NOT NULL DEFAULT 0,
    CONSTRAINT fk_pedido_cliente FOREIGN KEY (cliente_id) REFERENCES usuario(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_pedido_cliente ON pedido (cliente_id);

CREATE TABLE IF NOT EXISTS pedido_detalle (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    pedido_id       BIGINT NOT NULL,
    producto_id     INT NOT NULL,
    cantidad        INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_detalle_pedido FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE CASCADE,
    CONSTRAINT fk_detalle_producto FOREIGN KEY (producto_id) REFERENCES producto(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- INTERACCIONES (chatbot) · base del reporte mensual
-- ============================================================
CREATE TABLE IF NOT EXISTS interaccion (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id    BIGINT NULL,
    canal         VARCHAR(20) NOT NULL DEFAULT 'chatbot',
    fecha         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    calificacion  TINYINT NULL CHECK (calificacion BETWEEN 1 AND 5),
    sugerencia    TEXT NULL,
    CONSTRAINT fk_interaccion_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_interaccion_fecha ON interaccion (fecha);

-- ============================================================
-- DATOS DEMO
-- ============================================================

-- ============================================================
-- INTERACCIONES (chatbot) · base del reporte mensual
-- ============================================================
INSERT INTO interaccion (fecha, calificacion, sugerencia) VALUES
    (NOW() - INTERVAL 2 DAY,  5, 'Excelente servicio, las flores llegaron perfectas.'),
    (NOW() - INTERVAL 5 DAY,  4, 'Podrían tener más variedades de rosas en el catálogo.'),
    (NOW() - INTERVAL 9 DAY,  3, 'La entrega tardó 40 minutos más de lo prometido.'),
    (NOW() - INTERVAL 13 DAY, 5, 'Me encantó el arreglo de girasoles, lo recomiendo.'),
    (NOW() - INTERVAL 18 DAY, 4, 'Sería útil poder rastrear el pedido en tiempo real.'),
    (NOW() - INTERVAL 24 DAY, 2, 'El precio de las orquídeas me pareció muy elevado.'),
    (NOW() - INTERVAL 32 DAY, 4, 'Agreguen opciones de arreglos para cumpleaños infantiles.'),
    (NOW() - INTERVAL 40 DAY, 5, 'Muy buena atención por chat, respondieron rápido.'),
    (NOW() - INTERVAL 55 DAY, 4, 'Podrían ofrecer suscripciones mensuales de flores.'),
    (NOW() - INTERVAL 70 DAY, 3, 'El florista no siguió exactamente las instrucciones del pedido.'),
    (NOW() - INTERVAL 85 DAY, 5, 'Increíble calidad, las flores duraron más de dos semanas.'),
    (NOW() - INTERVAL 100 DAY,4, 'Acepten pagos con más métodos digitales como PayPal.'),
    (NOW() - INTERVAL 115 DAY,5, ''),
    (NOW() - INTERVAL 130 DAY,4, 'Me gustaría ver fotos de los arreglos antes de confirmar.'),
    (NOW() - INTERVAL 150 DAY,5, 'Perfecto para el aniversario de mis padres.');

SET FOREIGN_KEY_CHECKS = 1;
