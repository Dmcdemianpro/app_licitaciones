import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await params;

    const licitacion = await prisma.licitacion.findUnique({
      where: { id },
      include: {
        responsable: {
          select: {
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        items: true,
        adjudicacion: true,
        soporteTecnico: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!licitacion) {
      return NextResponse.json(
        { error: "Licitación no encontrada" },
        { status: 404 }
      );
    }

    // Generar HTML para PDF
    const html = generatePDFHTML(licitacion);

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error generando PDF:", error);
    return NextResponse.json(
      { error: "Error al generar PDF" },
      { status: 500 }
    );
  }
}

function generatePDFHTML(licitacion: any): string {
  const formatCLP = (value: any) => {
    if (!value) return "No especificado";
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(value);
  };

  const formatDate = (date: any) => {
    if (!date) return "No especificada";
    return new Date(date).toLocaleDateString("es-CL");
  };

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Licitación ${licitacion.folio} - Exportación PDF</title>
  <style>
    @media print {
      @page {
        margin: 2cm;
      }
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      .no-print {
        display: none !important;
      }
      .page-break {
        page-break-before: always;
      }
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }

    .container {
      background: white;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .header {
      border-bottom: 3px solid #4F46E5;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    .header h1 {
      color: #4F46E5;
      margin: 0 0 10px 0;
      font-size: 28px;
    }

    .header .subtitle {
      color: #666;
      font-size: 14px;
    }

    .section {
      margin-bottom: 30px;
    }

    .section-title {
      background: #4F46E5;
      color: white;
      padding: 10px 15px;
      margin-bottom: 15px;
      font-size: 18px;
      font-weight: bold;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 15px;
    }

    .grid-3 {
      grid-template-columns: repeat(3, 1fr);
    }

    .field {
      margin-bottom: 10px;
    }

    .field-label {
      font-weight: bold;
      color: #666;
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 3px;
    }

    .field-value {
      color: #333;
      font-size: 14px;
    }

    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }

    .badge-success { background: #10B981; color: white; }
    .badge-warning { background: #F59E0B; color: white; }
    .badge-danger { background: #EF4444; color: white; }
    .badge-info { background: #3B82F6; color: white; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    table th {
      background: #F3F4F6;
      padding: 10px;
      text-align: left;
      font-size: 12px;
      border-bottom: 2px solid #ddd;
    }

    table td {
      padding: 8px;
      border-bottom: 1px solid #eee;
      font-size: 13px;
    }

    .contact-card {
      border: 1px solid #ddd;
      padding: 15px;
      margin-bottom: 10px;
      border-radius: 5px;
      background: #f9f9f9;
    }

    .contact-name {
      font-weight: bold;
      color: #4F46E5;
      font-size: 16px;
      margin-bottom: 5px;
    }

    .contact-detail {
      margin: 5px 0;
      font-size: 13px;
    }

    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4F46E5;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }

    .print-button:hover {
      background: #4338CA;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #eee;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">Imprimir / Guardar como PDF</button>

  <div class="container">
    <div class="header">
      <h1>Licitación ${licitacion.folioFormateado || `HEC-${String(licitacion.folio).padStart(3, "0")}`}</h1>
      <div class="subtitle">Exportación generada el ${new Date().toLocaleDateString("es-CL")} a las ${new Date().toLocaleTimeString("es-CL")}</div>
    </div>

    <!-- Información General -->
    <div class="section">
      <div class="section-title">Información General</div>
      <div class="grid">
        <div class="field">
          <div class="field-label">Nombre</div>
          <div class="field-value">${licitacion.nombre}</div>
        </div>
        <div class="field">
          <div class="field-label">Estado</div>
          <div class="field-value">
            <span class="badge ${licitacion.estado === "ACTIVA" ? "badge-success" : licitacion.estado === "ADJUDICADA" ? "badge-info" : "badge-warning"}">${licitacion.estado}</span>
          </div>
        </div>
        <div class="field">
          <div class="field-label">Entidad</div>
          <div class="field-value">${licitacion.entidad}</div>
        </div>
        <div class="field">
          <div class="field-label">Monto Estimado</div>
          <div class="field-value">${formatCLP(licitacion.montoEstimado)} ${licitacion.moneda || "CLP"}</div>
        </div>
      </div>
      ${licitacion.descripcion ? `
      <div class="field">
        <div class="field-label">Descripción</div>
        <div class="field-value">${licitacion.descripcion}</div>
      </div>
      ` : ""}
    </div>

    <!-- Fechas Importantes -->
    <div class="section">
      <div class="section-title">Fechas Importantes</div>
      <div class="grid grid-3">
        <div class="field">
          <div class="field-label">Publicación</div>
          <div class="field-value">${formatDate(licitacion.fechaPublicacion)}</div>
        </div>
        <div class="field">
          <div class="field-label">Cierre</div>
          <div class="field-value">${formatDate(licitacion.fechaCierre)}</div>
        </div>
        <div class="field">
          <div class="field-label">Adjudicación</div>
          <div class="field-value">${formatDate(licitacion.fechaAdjudicacion)}</div>
        </div>
      </div>
    </div>

    <!-- Items -->
    ${licitacion.items && licitacion.items.length > 0 ? `
    <div class="section">
      <div class="section-title">Productos/Servicios Solicitados</div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Cantidad</th>
            <th>Unidad</th>
          </tr>
        </thead>
        <tbody>
          ${licitacion.items.map((item: any) => `
          <tr>
            <td>${item.correlativo}</td>
            <td>${item.nombreProducto || "N/D"}</td>
            <td>${item.categoria || "N/D"}</td>
            <td>${item.cantidad || "N/D"}</td>
            <td>${item.unidadMedida || "N/D"}</td>
          </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    ` : ""}

    <!-- Adjudicación -->
    ${licitacion.adjudicacion ? `
    <div class="section page-break">
      <div class="section-title">Información de Adjudicación</div>
      <div class="grid">
        <div class="field">
          <div class="field-label">Proveedor</div>
          <div class="field-value">${licitacion.adjudicacion.proveedorNombre || "N/D"}</div>
        </div>
        <div class="field">
          <div class="field-label">RUT Proveedor</div>
          <div class="field-value">${licitacion.adjudicacion.proveedorRut || "N/D"}</div>
        </div>
        <div class="field">
          <div class="field-label">Monto Adjudicado</div>
          <div class="field-value">${formatCLP(licitacion.adjudicacion.montoAdjudicado)}</div>
        </div>
        <div class="field">
          <div class="field-label">Fecha Adjudicación</div>
          <div class="field-value">${formatDate(licitacion.adjudicacion.fechaAdjudicacion)}</div>
        </div>
      </div>
    </div>
    ` : ""}

    <!-- Contactos de Soporte Técnico -->
    ${licitacion.soporteTecnico && licitacion.soporteTecnico.length > 0 ? `
    <div class="section page-break">
      <div class="section-title">Contactos de Soporte Técnico</div>
      ${licitacion.soporteTecnico.map((soporte: any) => `
      <div class="contact-card">
        <div class="contact-name">${soporte.nombreContacto} - ${soporte.tipoSoporte}</div>
        <div class="contact-detail"><strong>Email:</strong> ${soporte.emailContacto || "N/D"}</div>
        ${soporte.telefonoContacto ? `<div class="contact-detail"><strong>Teléfono:</strong> ${soporte.telefonoContacto}</div>` : ""}
        ${soporte.horarioInicio && soporte.horarioFin ? `<div class="contact-detail"><strong>Horario:</strong> ${soporte.horarioInicio} - ${soporte.horarioFin}</div>` : ""}
        ${soporte.diasDisponibles ? `<div class="contact-detail"><strong>Disponible:</strong> ${soporte.diasDisponibles}</div>` : ""}
        ${soporte.observaciones ? `<div class="contact-detail"><strong>Observaciones:</strong> ${soporte.observaciones}</div>` : ""}
      </div>
      `).join("")}
    </div>
    ` : ""}

    <div class="footer">
      <p>Este documento fue generado automáticamente por el Sistema de Gestión de Licitaciones</p>
      <p>Fecha y hora de generación: ${new Date().toLocaleString("es-CL")}</p>
    </div>
  </div>

  <script>
    // Auto-abrir el diálogo de impresión cuando se carga la página
    window.addEventListener('load', function() {
      setTimeout(() => {
        // window.print(); // Descomentar para auto-print
      }, 500);
    });
  </script>
</body>
</html>
  `;
}
