import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialTables1703000000000 implements MigrationInterface {
  name = 'CreateInitialTables1703000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla de roles
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" SERIAL NOT NULL,
        "name" character varying(50) NOT NULL,
        "description" character varying(200),
        "isActive" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "UQ_roles_name" UNIQUE ("name"),
        CONSTRAINT "PK_roles" PRIMARY KEY ("id")
      )
    `);

    // Crear tabla de usuarios
    await queryRunner.query(`
      CREATE TYPE "users_status_enum" AS ENUM('inactive', 'active', 'suspended')
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "uuid" uuid NOT NULL,
        "email" character varying(100) NOT NULL,
        "password" character varying(255) NOT NULL,
        "status" "users_status_enum" NOT NULL DEFAULT 'inactive',
        "first_name" character varying(50),
        "second_name" character varying(50),
        "first_lastname" character varying(50),
        "second_lastname" character varying(50),
        "identification_type" character varying(20),
        "identification_number" character varying(50),
        "phone_number" character varying(20),
        "invitation_date" TIMESTAMP,
        "activation_date" TIMESTAMP,
        "last_login" TIMESTAMP,
        "registration_ip" character varying(45),
        "registration_device" character varying(200),
        "is_temporary" boolean NOT NULL DEFAULT true,
        "invitation_token" character varying(255),
        "invitation_expires_at" TIMESTAMP,
        "role_id" integer,
        "invited_by_user_id" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "UQ_users_uuid" UNIQUE ("uuid"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Crear índices
    await queryRunner.query(
      `CREATE INDEX "IDX_users_email" ON "users" ("email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_uuid" ON "users" ("uuid")`,
    );

    // Crear foreign keys
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD CONSTRAINT "FK_users_role_id" 
      FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD CONSTRAINT "FK_users_invited_by_user_id" 
      FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_users_invited_by_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_users_role_id"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_users_uuid"`);
    await queryRunner.query(`DROP INDEX "IDX_users_email"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "users_status_enum"`);
    await queryRunner.query(`DROP TABLE "roles"`);
  }
}
