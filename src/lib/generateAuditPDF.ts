import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { SecurityAudit, AuditFinding, AuditModuleExecution } from '@/hooks/useSecurityAudits';

const severityColors: Record<string, [number, number, number]> = {
  critical: [220, 38, 38],
  high: [234, 88, 12],
  medium: [234, 179, 8],
  low: [59, 130, 246],
  info: [107, 114, 128],
};

const severityLabels: Record<string, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Médio',
  low: 'Baixo',
  info: 'Info',
};

export function generateAuditPDF(
  audit: SecurityAudit,
  findings: AuditFinding[],
  executions: AuditModuleExecution[]
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(11, 14, 20);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('KillaSpy', 14, 20);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatório de Auditoria de Segurança', 14, 30);
  
  // Date
  doc.setFontSize(10);
  doc.text(
    format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR }),
    pageWidth - 14,
    30,
    { align: 'right' }
  );
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Audit Info Section
  let yPos = 55;
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(audit.name, 14, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  
  if (audit.description) {
    doc.text(audit.description, 14, yPos);
    yPos += 6;
  }
  
  if (audit.target_url) {
    doc.text(`URL Alvo: ${audit.target_url}`, 14, yPos);
    yPos += 6;
  }
  
  if (audit.target_domain) {
    doc.text(`Domínio: ${audit.target_domain}`, 14, yPos);
    yPos += 6;
  }
  
  // Status and Dates
  yPos += 4;
  doc.setTextColor(0, 0, 0);
  
  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    running: 'Em Execução',
    completed: 'Concluída',
    failed: 'Falhou',
    cancelled: 'Cancelada',
  };
  
  doc.text(`Status: ${statusLabels[audit.status] || audit.status}`, 14, yPos);
  
  if (audit.completed_at) {
    doc.text(
      `Concluída em: ${format(new Date(audit.completed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}`,
      100,
      yPos
    );
  }
  
  // Summary Box
  yPos += 15;
  
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(14, yPos, pageWidth - 28, 30, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  const summaryY = yPos + 12;
  const colWidth = (pageWidth - 28) / 4;
  
  // Total Findings
  doc.setTextColor(59, 130, 246);
  doc.text('Total de Findings', 14 + colWidth * 0 + 5, summaryY);
  doc.setFontSize(18);
  doc.text(String(audit.total_findings || findings.length), 14 + colWidth * 0 + 5, summaryY + 12);
  
  // Critical
  doc.setFontSize(10);
  doc.setTextColor(220, 38, 38);
  doc.text('Críticos', 14 + colWidth * 1 + 5, summaryY);
  doc.setFontSize(18);
  doc.text(String(findings.filter(f => f.severity === 'critical').length), 14 + colWidth * 1 + 5, summaryY + 12);
  
  // High
  doc.setFontSize(10);
  doc.setTextColor(234, 88, 12);
  doc.text('Altos', 14 + colWidth * 2 + 5, summaryY);
  doc.setFontSize(18);
  doc.text(String(findings.filter(f => f.severity === 'high').length), 14 + colWidth * 2 + 5, summaryY + 12);
  
  // Medium
  doc.setFontSize(10);
  doc.setTextColor(234, 179, 8);
  doc.text('Médios', 14 + colWidth * 3 + 5, summaryY);
  doc.setFontSize(18);
  doc.text(String(findings.filter(f => f.severity === 'medium').length), 14 + colWidth * 3 + 5, summaryY + 12);
  
  // Findings Table
  yPos += 45;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Findings Detalhados', 14, yPos);
  
  yPos += 8;
  
  if (findings.length > 0) {
    const tableData = findings.map((finding) => [
      severityLabels[finding.severity] || finding.severity,
      finding.title,
      finding.description?.substring(0, 80) + (finding.description && finding.description.length > 80 ? '...' : '') || '-',
      finding.affected_url?.substring(0, 30) + (finding.affected_url && finding.affected_url.length > 30 ? '...' : '') || '-',
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Severidade', 'Título', 'Descrição', 'URL Afetada']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [11, 14, 20],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 45 },
        2: { cellWidth: 70 },
        3: { cellWidth: 40 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 0) {
          const severity = findings[data.row.index]?.severity;
          if (severity && severityColors[severity]) {
            data.cell.styles.textColor = severityColors[severity];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
      margin: { left: 14, right: 14 },
    });
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Nenhum finding registrado nesta auditoria.', 14, yPos);
  }
  
  // Module Executions (new page if needed)
  doc.addPage();
  
  doc.setFillColor(11, 14, 20);
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Execução de Módulos', 14, 16);
  
  yPos = 40;
  doc.setTextColor(0, 0, 0);
  
  if (executions.length > 0) {
    const moduleTypeLabels: Record<string, string> = {
      header_consistency_checker: 'Verificador de Headers',
      redirect_path_mapper: 'Mapeador de Redirecionamentos',
      ssl_certificate_auditor: 'Auditor SSL',
      domain_reputation_checker: 'Verificador de Reputação',
      tech_stack_identifier: 'Identificador Tech Stack',
      content_render_auditor: 'Auditor de Renderização',
      firecrawl_scraper: 'Firecrawl Scraper',
    };
    
    const statusLabelsModule: Record<string, string> = {
      pending: 'Pendente',
      running: 'Executando',
      completed: 'Concluído',
      failed: 'Falhou',
    };
    
    const execData = executions.map((exec) => [
      moduleTypeLabels[exec.module_type] || exec.module_type,
      statusLabelsModule[exec.status] || exec.status,
      exec.duration_ms ? `${exec.duration_ms}ms` : '-',
      exec.error_message?.substring(0, 40) || '-',
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Módulo', 'Status', 'Duração', 'Erro']],
      body: execData,
      theme: 'striped',
      headStyles: {
        fillColor: [11, 14, 20],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      margin: { left: 14, right: 14 },
    });
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount} | Gerado por KillaSpy Security Suite`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Download
  const fileName = `auditoria-${audit.name.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}
