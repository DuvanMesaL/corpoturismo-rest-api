-- CreateEnum
CREATE TYPE "public"."EstadoUsuario" AS ENUM ('INACTIVO', 'ACTIVO');

-- CreateEnum
CREATE TYPE "public"."EstadoRecalada" AS ENUM ('PROGRAMADA', 'EN_PUERTO', 'FINALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "public"."EstadoTurno" AS ENUM ('DISPONIBLE', 'TOMADO', 'EN_USO', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "public"."EstadoAtencion" AS ENUM ('PENDIENTE', 'EN_PROGRESO', 'COMPLETADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "public"."roles" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "permisos" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."usuarios" (
    "id" TEXT NOT NULL,
    "uuid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "tipoIdentificacion" TEXT,
    "numeroIdentificacion" TEXT,
    "primerNombre" TEXT,
    "segundoNombre" TEXT,
    "primerApellido" TEXT,
    "segundoApellido" TEXT,
    "telefono" TEXT,
    "rolId" TEXT NOT NULL,
    "estado" "public"."EstadoUsuario" NOT NULL DEFAULT 'INACTIVO',
    "fechaInvitacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActivacion" TIMESTAMP(3),
    "usuarioInvitadorId" TEXT,
    "ipRegistro" TEXT,
    "dispositivoRegistro" TEXT,
    "esTemporal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."buques" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "bandera" TEXT,
    "eslora" DOUBLE PRECISION,
    "manga" DOUBLE PRECISION,
    "calado" DOUBLE PRECISION,
    "tonelaje" DOUBLE PRECISION,
    "tipoEmbarcacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."puertos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "pais" TEXT NOT NULL,
    "coordenadas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "puertos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."recaladas" (
    "id" TEXT NOT NULL,
    "buqueId" TEXT NOT NULL,
    "puertoOrigenId" TEXT,
    "puertoDestinoId" TEXT,
    "fechaLlegada" TIMESTAMP(3) NOT NULL,
    "fechaSalida" TIMESTAMP(3),
    "numeroViaje" TEXT,
    "observaciones" TEXT,
    "estado" "public"."EstadoRecalada" NOT NULL DEFAULT 'PROGRAMADA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recaladas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."turnos" (
    "id" TEXT NOT NULL,
    "recaladaId" TEXT,
    "guiaId" TEXT,
    "creadorId" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "estado" "public"."EstadoTurno" NOT NULL DEFAULT 'DISPONIBLE',
    "observaciones" TEXT,
    "horasTrabajadas" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turnos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tipos_atencion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "duracion" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_atencion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."atenciones" (
    "id" TEXT NOT NULL,
    "recaladaId" TEXT NOT NULL,
    "turnoId" TEXT,
    "tipoAtencionId" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "estado" "public"."EstadoAtencion" NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atenciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "public"."roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_uuid_key" ON "public"."usuarios"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "public"."usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_numeroIdentificacion_key" ON "public"."usuarios"("numeroIdentificacion");

-- CreateIndex
CREATE UNIQUE INDEX "puertos_nombre_key" ON "public"."puertos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "puertos_codigo_key" ON "public"."puertos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_atencion_nombre_key" ON "public"."tipos_atencion"("nombre");

-- AddForeignKey
ALTER TABLE "public"."usuarios" ADD CONSTRAINT "usuarios_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "public"."roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usuarios" ADD CONSTRAINT "usuarios_usuarioInvitadorId_fkey" FOREIGN KEY ("usuarioInvitadorId") REFERENCES "public"."usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recaladas" ADD CONSTRAINT "recaladas_buqueId_fkey" FOREIGN KEY ("buqueId") REFERENCES "public"."buques"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recaladas" ADD CONSTRAINT "recaladas_puertoOrigenId_fkey" FOREIGN KEY ("puertoOrigenId") REFERENCES "public"."puertos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recaladas" ADD CONSTRAINT "recaladas_puertoDestinoId_fkey" FOREIGN KEY ("puertoDestinoId") REFERENCES "public"."puertos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."turnos" ADD CONSTRAINT "turnos_recaladaId_fkey" FOREIGN KEY ("recaladaId") REFERENCES "public"."recaladas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."turnos" ADD CONSTRAINT "turnos_guiaId_fkey" FOREIGN KEY ("guiaId") REFERENCES "public"."usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."turnos" ADD CONSTRAINT "turnos_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "public"."usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."atenciones" ADD CONSTRAINT "atenciones_recaladaId_fkey" FOREIGN KEY ("recaladaId") REFERENCES "public"."recaladas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."atenciones" ADD CONSTRAINT "atenciones_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES "public"."turnos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."atenciones" ADD CONSTRAINT "atenciones_tipoAtencionId_fkey" FOREIGN KEY ("tipoAtencionId") REFERENCES "public"."tipos_atencion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
