import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBusinessTables1703000001000 implements MigrationInterface {
  name = 'CreateBusinessTables1703000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tipos enum
    await queryRunner.query(
      `CREATE TYPE "buques_tipo_enum" AS ENUM('carga', 'pasajeros', 'tanquero', 'contenedores', 'granelero', 'pesquero', 'otros')`,
    );
    await queryRunner.query(
      `CREATE TYPE "buques_estado_enum" AS ENUM('activo', 'inactivo', 'mantenimiento')`,
    );
    await queryRunner.query(
      `CREATE TYPE "recaladas_estado_enum" AS ENUM('programada', 'en_transito', 'atracada', 'en_operacion', 'finalizada', 'cancelada')`,
    );
    await queryRunner.query(
      `CREATE TYPE "recaladas_tipo_operacion_enum" AS ENUM('carga', 'descarga', 'carga_descarga', 'transbordo', 'aprovisionamiento', 'reparacion', 'otros')`,
    );
    await queryRunner.query(
      `CREATE TYPE "atenciones_tipo_enum" AS ENUM('practicaje', 'remolque', 'amarre', 'desamarre', 'carga', 'descarga', 'inspeccion', 'aprovisionamiento', 'otros')`,
    );
    await queryRunner.query(
      `CREATE TYPE "atenciones_estado_enum" AS ENUM('pendiente', 'en_proceso', 'completada', 'cancelada', 'suspendida')`,
    );
    await queryRunner.query(
      `CREATE TYPE "atenciones_prioridad_enum" AS ENUM('baja', 'normal', 'alta', 'urgente')`,
    );
    await queryRunner.query(
      `CREATE TYPE "turnos_estado_enum" AS ENUM('disponible', 'tomado', 'en_uso', 'completado', 'cancelado', 'expirado')`,
    );
    await queryRunner.query(
      `CREATE TYPE "turnos_tipo_enum" AS ENUM('normal', 'prioritario', 'urgente', 'programado')`,
    );

    // Crear tabla buques
    await queryRunner.query(`
      CREATE TABLE "buques" (
        "id" SERIAL NOT NULL,
        "codigo" character varying(20) NOT NULL,
        "nombre" character varying(100) NOT NULL,
        "bandera" character varying(50),
        "imo" character varying(20),
        "mmsi" character varying(20),
        "tipo" "buques_tipo_enum" NOT NULL DEFAULT 'carga',
        "eslora" numeric(10,2),
        "manga" numeric(10,2),
        "calado" numeric(10,2),
        "tonelaje" numeric(12,2),
        "armador" character varying(100),
        "agente" character varying(100),
        "estado" "buques_estado_enum" NOT NULL DEFAULT 'activo',
        "observaciones" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "UQ_buques_codigo" UNIQUE ("codigo"),
        CONSTRAINT "PK_buques" PRIMARY KEY ("id")
      )
    `);

    // Crear tabla recaladas
    await queryRunner.query(`
      CREATE TABLE "recaladas" (
        "id" SERIAL NOT NULL,
        "codigo" character varying(20) NOT NULL,
        "buque_id" integer NOT NULL,
        "fecha_arribo_programada" TIMESTAMP NOT NULL,
        "fecha_arribo_real" TIMESTAMP,
        "fecha_zarpe_programada" TIMESTAMP,
        "fecha_zarpe_real" TIMESTAMP,
        "muelle" character varying(20),
        "posicion" character varying(10),
        "estado" "recaladas_estado_enum" NOT NULL DEFAULT 'programada',
        "tipoOperacion" "recaladas_tipo_operacion_enum" NOT NULL DEFAULT 'carga_descarga',
        "cargaProgramada" numeric(12,2),
        "cargaReal" numeric(12,2),
        "mercancia" character varying(100),
        "consignatario" character varying(100),
        "observaciones" text,
        "requiere_practico" boolean NOT NULL DEFAULT false,
        "requiere_remolcador" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "UQ_recaladas_codigo" UNIQUE ("codigo"),
        CONSTRAINT "PK_recaladas" PRIMARY KEY ("id")
      )
    `);

    // Crear tabla atenciones
    await queryRunner.query(`
      CREATE TABLE "atenciones" (
        "id" SERIAL NOT NULL,
        "codigo" character varying(20) NOT NULL,
        "recalada_id" integer NOT NULL,
        "tipo" "atenciones_tipo_enum" NOT NULL,
        "descripcion" character varying(200) NOT NULL,
        "estado" "atenciones_estado_enum" NOT NULL DEFAULT 'pendiente',
        "prioridad" "atenciones_prioridad_enum" NOT NULL DEFAULT 'normal',
        "fecha_programada" TIMESTAMP NOT NULL,
        "fecha_inicio" TIMESTAMP,
        "fecha_fin" TIMESTAMP,
        "duracion_estimada" integer,
        "duracion_real" integer,
        "responsable_id" integer,
        "observaciones" text,
        "requisitos" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "UQ_atenciones_codigo" UNIQUE ("codigo"),
        CONSTRAINT "PK_atenciones" PRIMARY KEY ("id")
      )
    `);

    // Crear tabla turnos
    await queryRunner.query(`
      CREATE TABLE "turnos" (
        "id" SERIAL NOT NULL,
        "codigo" character varying(20) NOT NULL,
        "atencion_id" integer NOT NULL,
        "tipo" "turnos_tipo_enum" NOT NULL DEFAULT 'normal',
        "estado" "turnos_estado_enum" NOT NULL DEFAULT 'disponible',
        "numero_turno" integer NOT NULL,
        "fecha_creacion" TIMESTAMP NOT NULL,
        "fecha_programada" TIMESTAMP,
        "fecha_tomado" TIMESTAMP,
        "fecha_inicio" TIMESTAMP,
        "fecha_fin" TIMESTAMP,
        "fecha_expiracion" TIMESTAMP,
        "usuario_asignado_id" integer,
        "usuario_creador_id" integer,
        "tiempo_estimado" integer,
        "tiempo_real" integer,
        "observaciones" text,
        "notas_finalizacion" text,
        "requiere_confirmacion" boolean NOT NULL DEFAULT false,
        "es_reprogramable" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "UQ_turnos_codigo" UNIQUE ("codigo"),
        CONSTRAINT "PK_turnos" PRIMARY KEY ("id")
      )
    `);

    // Crear índices
    await queryRunner.query(
      `CREATE INDEX "IDX_buques_codigo" ON "buques" ("codigo")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_buques_estado" ON "buques" ("estado")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_recaladas_codigo" ON "recaladas" ("codigo")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_recaladas_estado" ON "recaladas" ("estado")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_recaladas_fecha_arribo" ON "recaladas" ("fecha_arribo_programada")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_atenciones_codigo" ON "atenciones" ("codigo")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_atenciones_estado" ON "atenciones" ("estado")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_turnos_codigo" ON "turnos" ("codigo")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_turnos_estado" ON "turnos" ("estado")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_turnos_numero" ON "turnos" ("numero_turno")`,
    );

    // Crear foreign keys
    await queryRunner.query(`
      ALTER TABLE "recaladas" 
      ADD CONSTRAINT "FK_recaladas_buque_id" 
      FOREIGN KEY ("buque_id") REFERENCES "buques"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "atenciones" 
      ADD CONSTRAINT "FK_atenciones_recalada_id" 
      FOREIGN KEY ("recalada_id") REFERENCES "recaladas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "atenciones" 
      ADD CONSTRAINT "FK_atenciones_responsable_id" 
      FOREIGN KEY ("responsable_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "turnos" 
      ADD CONSTRAINT "FK_turnos_atencion_id" 
      FOREIGN KEY ("atencion_id") REFERENCES "atenciones"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "turnos" 
      ADD CONSTRAINT "FK_turnos_usuario_asignado_id" 
      FOREIGN KEY ("usuario_asignado_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "turnos" 
      ADD CONSTRAINT "FK_turnos_usuario_creador_id" 
      FOREIGN KEY ("usuario_creador_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys
    await queryRunner.query(
      `ALTER TABLE "turnos" DROP CONSTRAINT "FK_turnos_usuario_creador_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "turnos" DROP CONSTRAINT "FK_turnos_usuario_asignado_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "turnos" DROP CONSTRAINT "FK_turnos_atencion_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atenciones" DROP CONSTRAINT "FK_atenciones_responsable_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "atenciones" DROP CONSTRAINT "FK_atenciones_recalada_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recaladas" DROP CONSTRAINT "FK_recaladas_buque_id"`,
    );

    // Eliminar índices
    await queryRunner.query(`DROP INDEX "IDX_turnos_numero"`);
    await queryRunner.query(`DROP INDEX "IDX_turnos_estado"`);
    await queryRunner.query(`DROP INDEX "IDX_turnos_codigo"`);
    await queryRunner.query(`DROP INDEX "IDX_atenciones_estado"`);
    await queryRunner.query(`DROP INDEX "IDX_atenciones_codigo"`);
    await queryRunner.query(`DROP INDEX "IDX_recaladas_fecha_arribo"`);
    await queryRunner.query(`DROP INDEX "IDX_recaladas_estado"`);
    await queryRunner.query(`DROP INDEX "IDX_recaladas_codigo"`);
    await queryRunner.query(`DROP INDEX "IDX_buques_estado"`);
    await queryRunner.query(`DROP INDEX "IDX_buques_codigo"`);

    // Eliminar tablas
    await queryRunner.query(`DROP TABLE "turnos"`);
    await queryRunner.query(`DROP TABLE "atenciones"`);
    await queryRunner.query(`DROP TABLE "recaladas"`);
    await queryRunner.query(`DROP TABLE "buques"`);

    // Eliminar tipos enum
    await queryRunner.query(`DROP TYPE "turnos_tipo_enum"`);
    await queryRunner.query(`DROP TYPE "turnos_estado_enum"`);
    await queryRunner.query(`DROP TYPE "atenciones_prioridad_enum"`);
    await queryRunner.query(`DROP TYPE "atenciones_estado_enum"`);
    await queryRunner.query(`DROP TYPE "atenciones_tipo_enum"`);
    await queryRunner.query(`DROP TYPE "recaladas_tipo_operacion_enum"`);
    await queryRunner.query(`DROP TYPE "recaladas_estado_enum"`);
    await queryRunner.query(`DROP TYPE "buques_estado_enum"`);
    await queryRunner.query(`DROP TYPE "buques_tipo_enum"`);
  }
}
