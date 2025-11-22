import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Download,
  Upload,
  Eye,
  MessageCircle,
  Settings,
  Github,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LLMChat from "@/components/LLMChat";
import GitHubDeploy from "@/components/GitHubDeploy";

interface Section {
  id: string;
  type: "hero" | "features" | "cta" | "text" | "gallery";
  name: string;
  config: Record<string, any>;
}

interface Page {
  id: string;
  name: string;
  sections: Section[];
}

const defaultSectionConfigs: Record<string, Record<string, any>> = {
  hero: {
    title: "Welcome to Your Site",
    subtitle: "Create stunning pages with our visual builder",
    bgColor: "#FF6B35",
    textColor: "#FFFFFF",
  },
  features: {
    title: "Features",
    items: [
      {
        icon: "⚡",
        title: "Fast",
        description: "Lightning quick performance",
      },
      { icon: "🎨", title: "Beautiful", description: "Stunning designs" },
      { icon: "🔧", title: "Easy", description: "Simple to use" },
    ],
  },
  cta: {
    title: "Ready to get started?",
    buttonText: "Get Started",
    buttonColor: "#FFA400",
  },
  text: {
    content: "Add your text content here",
    fontSize: "16",
    textColor: "#FFFFFF",
  },
  gallery: {
    title: "Gallery",
    images: [
      "https://via.placeholder.com/300x200?text=Image+1",
      "https://via.placeholder.com/300x200?text=Image+2",
      "https://via.placeholder.com/300x200?text=Image+3",
    ],
  },
};

const sectionTypes: Array<{
  id: string;
  name: string;
  icon: string;
  description: string;
}> = [
  {
    id: "hero",
    name: "Hero",
    icon: "🔥",
    description: "Large hero section with title",
  },
  {
    id: "features",
    name: "Features",
    icon: "✨",
    description: "Showcase key features",
  },
  {
    id: "cta",
    name: "Call to Action",
    icon: "🎯",
    description: "Engage with a CTA button",
  },
  { id: "text", name: "Text", icon: "📝", description: "Text content block" },
  {
    id: "gallery",
    name: "Gallery",
    icon: "🖼️",
    description: "Image gallery",
  },
];

export default function Index() {
  const [page, setPage] = useState<Page>({
    id: "default",
    name: "My Page",
    sections: [
      {
        id: "1",
        type: "hero",
        name: "Hero Section",
        config: defaultSectionConfigs.hero,
      },
    ],
  });

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    page.sections[0]?.id || null,
  );
  const [showAddSection, setShowAddSection] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showLLMChat, setShowLLMChat] = useState(false);
  const [showGitHubDeploy, setShowGitHubDeploy] = useState(false);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("page-builder-page");
    if (saved) {
      setPage(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("page-builder-page", JSON.stringify(page));
  }, [page]);

  const selectedSection = page.sections.find((s) => s.id === selectedSectionId);

  const addSection = (type: string) => {
    const newSection: Section = {
      id: Date.now().toString(),
      type: type as Section["type"],
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Section`,
      config: { ...defaultSectionConfigs[type] },
    };
    setPage({
      ...page,
      sections: [...page.sections, newSection],
    });
    setShowAddSection(false);
    setSelectedSectionId(newSection.id);
  };

  const deleteSection = (id: string) => {
    setPage({
      ...page,
      sections: page.sections.filter((s) => s.id !== id),
    });
    if (selectedSectionId === id) {
      setSelectedSectionId(page.sections[0]?.id || null);
    }
  };

  const duplicateSection = (id: string) => {
    const section = page.sections.find((s) => s.id === id);
    if (!section) return;
    const newSection: Section = {
      ...section,
      id: Date.now().toString(),
      name: `${section.name} (Copy)`,
      config: { ...section.config },
    };
    const index = page.sections.findIndex((s) => s.id === id);
    const newSections = [...page.sections];
    newSections.splice(index + 1, 0, newSection);
    setPage({ ...page, sections: newSections });
  };

  const moveSection = (id: string, direction: "up" | "down") => {
    const index = page.sections.findIndex((s) => s.id === id);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === page.sections.length - 1)
    )
      return;

    const newSections = [...page.sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newSections[index], newSections[targetIndex]] = [
      newSections[targetIndex],
      newSections[index],
    ];
    setPage({ ...page, sections: newSections });
  };

  const updateSectionConfig = (id: string, config: Record<string, any>) => {
    const updatedPage = {
      ...page,
      sections: page.sections.map((s) =>
        s.id === id ? { ...s, config: { ...config } } : s,
      ),
    };
    setPage(updatedPage);
  };

  const handleDragStart = (id: string, e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    setDraggedSectionId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (targetId: string, e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedSectionId || draggedSectionId === targetId) return;

    const draggedIndex = page.sections.findIndex(
      (s) => s.id === draggedSectionId,
    );
    const targetIndex = page.sections.findIndex((s) => s.id === targetId);

    const newSections = [...page.sections];
    const [draggedSection] = newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, draggedSection);

    setPage({ ...page, sections: newSections });
    setDraggedSectionId(null);
  };

  const exportHTML = () => {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${page.name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0d1f1f; color: #f5e6d3; }
        .section { padding: 4rem 2rem; text-align: center; }
        .hero { background: linear-gradient(135deg, #FF6B35 0%, #FFA400 100%); color: white; }
        .hero h1 { font-size: 3rem; margin-bottom: 1rem; font-weight: 800; }
        .hero p { font-size: 1.25rem; opacity: 0.95; }
        .features { background: #1a2a2a; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; margin-top: 2rem; }
        .feature-card { background: #0d1f1f; padding: 2rem; border-radius: 8px; border: 1px solid #2a3a3a; }
        .feature-card .icon { font-size: 2.5rem; margin-bottom: 1rem; }
        .feature-card h3 { margin: 1rem 0 0.5rem; font-size: 1.25rem; }
        .feature-card p { opacity: 0.8; font-size: 0.9rem; }
        .cta { background: #FF6B35; color: white; padding: 6rem 2rem; }
        .cta h2 { font-size: 2.5rem; margin-bottom: 2rem; }
        .cta button { background: #FFA400; color: #0d1f1f; border: none; padding: 1rem 2rem; border-radius: 8px; font-size: 1.1rem; font-weight: 600; cursor: pointer; }
        .cta button:hover { background: #ffb520; transform: translateY(-2px); }
        .text-section { background: #0d1f1f; }
        .text-section p { line-height: 1.6; max-width: 800px; margin: 0 auto; }
        .gallery { background: #1a2a2a; }
        .gallery-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; margin-top: 2rem; }
        .gallery-item { border-radius: 8px; overflow: hidden; aspect-ratio: 1; }
        .gallery-item img { width: 100%; height: 100%; object-fit: cover; }
    </style>
</head>
<body>
`;

    page.sections.forEach((section) => {
      html += renderSectionHTML(section);
    });

    html += `
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${page.name.replace(/\s+/g, "-").toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderSectionHTML = (section: Section): string => {
    switch (section.type) {
      case "hero":
        return `<section class="section hero" style="background: ${section.config.bgColor}">
    <h1>${section.config.title}</h1>
    <p>${section.config.subtitle}</p>
</section>`;
      case "features":
        return `<section class="section features">
    <h2>${section.config.title}</h2>
    <div class="features-grid">
        ${section.config.items
          .map(
            (item: any) =>
              `<div class="feature-card">
            <div class="icon">${item.icon}</div>
            <h3>${item.title}</h3>
            <p>${item.description}</p>
        </div>`,
          )
          .join("")}
    </div>
</section>`;
      case "cta":
        return `<section class="section cta">
    <h2>${section.config.title}</h2>
    <button>${section.config.buttonText}</button>
</section>`;
      case "text":
        return `<section class="section text-section">
    <p style="font-size: ${section.config.fontSize}px">${section.config.content}</p>
</section>`;
      case "gallery":
        return `<section class="section gallery">
    <h2>${section.config.title}</h2>
    <div class="gallery-grid">
        ${section.config.images
          .map(
            (img: string) =>
              `<div class="gallery-item"><img src="${img}" alt="Gallery image"></div>`,
          )
          .join("")}
    </div>
</section>`;
      default:
        return "";
    }
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.sections) {
          setPage(imported);
          setShowImportDialog(false);
        }
      } catch (error) {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  const exportJSON = () => {
    const dataStr = JSON.stringify(page, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${page.name.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLLMGenerateSection = (sectionData: {
    type: string;
    config: Record<string, any>;
  }) => {
    const newSection: Section = {
      id: Date.now().toString(),
      type: sectionData.type as Section["type"],
      name: `${sectionData.type.charAt(0).toUpperCase() + sectionData.type.slice(1)} Section`,
      config: sectionData.config,
    };
    setPage({
      ...page,
      sections: [...page.sections, newSection],
    });
    setSelectedSectionId(newSection.id);
  };

  return (
    <div className="h-screen bg-prometheus-night text-prometheus-fire-light flex flex-col">
      {/* Header */}
      <header className="border-b border-prometheus-fire/40 bg-gradient-to-r from-slate-800/60 to-slate-900/40 px-6 py-4 flex items-center justify-between relative overflow-hidden">
        <div className="flex items-center gap-3 relative z-10">
          <div className="text-3xl font-bold bg-gradient-to-r from-prometheus-fire to-prometheus-flame bg-clip-text text-transparent">
            🔥 FireBuilder
          </div>
          <span className="text-xs text-orange-200 opacity-70 px-2 py-1 rounded-full bg-prometheus-fire/20 border border-prometheus-fire/40">
            Offline-First
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLLMChat(true)}
            className="border-prometheus-fire/50 hover:bg-prometheus-fire/10 text-prometheus-fire-light"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            AI Assistant
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="border-prometheus-fire/40 hover:bg-prometheus-fire/10 text-prometheus-fire-light"
          >
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? "Editor" : "Preview"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExportDialog(true)}
            className="border-prometheus-fire/40 hover:bg-prometheus-fire/10 text-prometheus-fire-light"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImportDialog(true)}
            className="border-prometheus-fire/40 hover:bg-prometheus-fire/10 text-prometheus-fire-light"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGitHubDeploy(true)}
            className="border-prometheus-fire/40 hover:bg-prometheus-fire/10 text-prometheus-fire-light"
          >
            <Github className="w-4 h-4 mr-2" />
            Deploy
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Sections List */}
        {!showPreview && (
          <div className="w-64 lg:w-52 border-r border-prometheus-fire/30 bg-slate-800/20 overflow-y-auto p-4 lg:pr-16 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-prometheus-fire-light">
                Sections
              </h2>
              <Button
                size="sm"
                onClick={() => setShowAddSection(true)}
                className="bg-prometheus-fire hover:bg-prometheus-fire/90 text-white font-semibold"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto">
              {page.sections.map((section, index) => (
                <div
                  key={section.id}
                  draggable
                  onDragStart={(e) => handleDragStart(section.id, e)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(section.id, e)}
                  className={`p-3 rounded-lg transition-all duration-200 ${
                    selectedSectionId === section.id
                      ? "bg-prometheus-fire/15 border border-prometheus-fire/50 shadow-md shadow-prometheus-fire/20"
                      : "bg-slate-800/40 border border-slate-700 hover:bg-slate-800/60"
                  } ${draggedSectionId === section.id ? "opacity-50" : "opacity-100"}`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="cursor-grab active:cursor-grabbing mt-1 text-prometheus-fire/60 hover:text-prometheus-fire"
                      title="Drag to reorder"
                    >
                      ⋮⋮
                    </div>
                    <div
                      className="flex-1"
                      onClick={() => setSelectedSectionId(section.id)}
                    >
                      <div className="font-medium text-sm mb-2 text-prometheus-fire-light">
                        {sectionTypes.find((t) => t.id === section.type)?.icon}{" "}
                        {section.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 text-xs mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateSection(section.id);
                      }}
                      className="h-6 w-6 p-0 hover:bg-prometheus-fire/20"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSection(section.id, "up");
                      }}
                      disabled={index === 0}
                      className="h-6 w-6 p-0 hover:bg-prometheus-fire/20"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSection(section.id, "down");
                      }}
                      disabled={index === page.sections.length - 1}
                      className="h-6 w-6 p-0 hover:bg-prometheus-fire/20"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSection(section.id);
                      }}
                      className="h-6 w-6 p-0 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Center - Canvas */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 relative">
          {/* Fire-like glow background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-prometheus-fire to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-t from-prometheus-flame to-transparent rounded-full blur-3xl opacity-60" />
          </div>
          <div ref={canvasRef} className="max-w-6xl mx-auto relative z-10">
            {showPreview ? (
              <div className="bg-prometheus-night">
                {page.sections.map((section) => (
                  <div
                    key={section.id}
                    dangerouslySetInnerHTML={{
                      __html: renderSectionHTML(section),
                    }}
                  />
                ))}
              </div>
            ) : (
              <div>
                {page.sections.map((section) => (
                  <div
                    key={section.id}
                    onClick={() => setSelectedSectionId(section.id)}
                    className={`border-2 transition-all duration-200 cursor-pointer ${
                      selectedSectionId === section.id
                        ? "border-prometheus-fire/70 shadow-lg shadow-prometheus-fire/40"
                        : "border-slate-700/50 hover:border-prometheus-fire/50"
                    }`}
                  >
                    <SectionRenderer section={section} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Properties */}
        {!showPreview && selectedSection && (
          <div className="w-80 border-l border-prometheus-fire/30 bg-slate-800/30 overflow-y-auto p-4">
            <div className="mb-4 pb-4 border-b border-prometheus-fire/20">
              <p className="text-xs text-slate-400 opacity-70 uppercase tracking-wider mb-1">
                Editing
              </p>
              <h2 className="text-lg font-semibold text-prometheus-fire-light">
                {selectedSection.name}
              </h2>
              <p className="text-xs text-prometheus-fire-light/70 mt-1">
                Update properties below to see changes instantly
              </p>
            </div>
            <PropertyEditor
              section={selectedSection}
              onChange={(config) =>
                updateSectionConfig(selectedSection.id, config)
              }
            />
          </div>
        )}
      </div>

      {/* Add Section Dialog */}
      <Dialog open={showAddSection} onOpenChange={setShowAddSection}>
        <DialogContent className="bg-slate-800 border-prometheus-fire/40">
          <DialogHeader>
            <DialogTitle>Add Section</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {sectionTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => addSection(type.id)}
                className="p-4 rounded-lg bg-slate-800/50 hover:bg-prometheus-fire/20 border border-slate-700 hover:border-prometheus-fire transition-all text-left"
              >
                <div className="text-2xl mb-2">{type.icon}</div>
                <div className="font-semibold text-sm">{type.name}</div>
                <div className="text-xs opacity-75">{type.description}</div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="bg-slate-800 border-prometheus-fire/40">
          <DialogHeader>
            <DialogTitle>Import Page</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-prometheus-smoke/50 rounded-lg border border-prometheus-smoke">
              <label className="cursor-pointer flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span>Select JSON file</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={importJSON}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle>Export Page</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              onClick={exportHTML}
              className="w-full bg-prometheus-fire hover:bg-prometheus-fire/90 text-prometheus-night"
            >
              <Download className="w-4 h-4 mr-2" />
              Export as HTML
            </Button>
            <Button
              onClick={exportJSON}
              variant="outline"
              className="w-full border-prometheus-fire/30 hover:bg-prometheus-fire/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Export as JSON
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* LLM Chat */}
      <LLMChat
        open={showLLMChat}
        onClose={() => setShowLLMChat(false)}
        onGenerateSection={handleLLMGenerateSection}
        currentSectionType={selectedSection?.type}
      />

      {/* GitHub Deploy */}
      <GitHubDeploy
        open={showGitHubDeploy}
        onClose={() => setShowGitHubDeploy(false)}
        pageData={page}
      />
    </div>
  );
}

function SectionRenderer({ section }: { section: Section }) {
  switch (section.type) {
    case "hero":
      return (
        <div
          className="px-8 py-16 text-center text-white"
          style={{ backgroundColor: section.config.bgColor }}
        >
          <h1 className="text-4xl font-bold mb-4">{section.config.title}</h1>
          <p className="text-xl opacity-90">{section.config.subtitle}</p>
        </div>
      );
    case "features":
      return (
        <div className="px-8 py-16 bg-prometheus-smoke/30">
          <h2 className="text-3xl font-bold text-center mb-12">
            {section.config.title}
          </h2>
          <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
            {section.config.items.map((item: any, i: number) => (
              <div
                key={i}
                className="p-6 bg-prometheus-smoke/50 rounded-lg border border-prometheus-smoke"
              >
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm opacity-75">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      );
    case "cta":
      return (
        <div
          className="px-8 py-16 text-center"
          style={{
            backgroundColor: section.config.buttonColor || "#FF6B35",
          }}
        >
          <h2 className="text-3xl font-bold mb-6 text-white">
            {section.config.title}
          </h2>
          <button className="px-8 py-3 bg-prometheus-flame text-prometheus-night font-bold rounded-lg hover:opacity-90 transition-opacity">
            {section.config.buttonText}
          </button>
        </div>
      );
    case "text":
      return (
        <div className="px-8 py-12 max-w-4xl mx-auto">
          <p
            style={{
              fontSize: `${section.config.fontSize}px`,
              color: section.config.textColor,
            }}
            className="leading-relaxed"
          >
            {section.config.content}
          </p>
        </div>
      );
    case "gallery":
      return (
        <div className="px-8 py-16 bg-prometheus-smoke/30">
          <h2 className="text-3xl font-bold text-center mb-12">
            {section.config.title}
          </h2>
          <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
            {section.config.images.map((img: string, i: number) => (
              <img
                key={i}
                src={img}
                alt="Gallery item"
                className="rounded-lg w-full h-48 object-cover"
              />
            ))}
          </div>
        </div>
      );
    default:
      return null;
  }
}

function PropertyEditor({
  section,
  onChange,
}: {
  section: Section;
  onChange: (config: Record<string, any>) => void;
}) {
  const handleChange = (key: string, value: any) => {
    onChange({
      ...section.config,
      [key]: value,
    });
  };

  const handleItemChange = (itemIndex: number, key: string, value: any) => {
    const items = [...section.config.items];
    items[itemIndex] = { ...items[itemIndex], [key]: value };
    onChange({
      ...section.config,
      items,
    });
  };

  const handleImageChange = (imageIndex: number, value: string) => {
    const images = [...section.config.images];
    images[imageIndex] = value;
    onChange({
      ...section.config,
      images,
    });
  };

  return (
    <div className="space-y-4">
      {section.type === "hero" && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2 text-prometheus-flame">
              Title
            </label>
            <input
              type="text"
              value={section.config.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/40 border border-slate-700 rounded-lg text-slate-200 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 focus:bg-slate-800/60 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-prometheus-flame">
              Subtitle
            </label>
            <input
              type="text"
              value={section.config.subtitle}
              onChange={(e) => handleChange("subtitle", e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/40 border border-slate-700 rounded-lg text-slate-200 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 focus:bg-slate-800/60 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-prometheus-flame">
              Background Color
            </label>
            <input
              type="color"
              value={section.config.bgColor}
              onChange={(e) => handleChange("bgColor", e.target.value)}
              className="w-full h-10 rounded-lg cursor-pointer"
            />
          </div>
        </>
      )}

      {section.type === "features" && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2 text-prometheus-flame">
              Title
            </label>
            <input
              type="text"
              value={section.config.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/40 border border-slate-700 rounded-lg text-slate-200 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 focus:bg-slate-800/60 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Features</label>
            <div className="space-y-3">
              {section.config.items.map((item: any, i: number) => (
                <div key={i} className="p-3 bg-prometheus-smoke/30 rounded-lg">
                  <input
                    type="text"
                    placeholder="Icon"
                    value={item.icon}
                    onChange={(e) =>
                      handleItemChange(i, "icon", e.target.value)
                    }
                    className="w-full px-2 py-1 bg-prometheus-smoke/50 border border-prometheus-smoke rounded text-prometheus-fire-light text-sm mb-2"
                  />
                  <input
                    type="text"
                    placeholder="Title"
                    value={item.title}
                    onChange={(e) =>
                      handleItemChange(i, "title", e.target.value)
                    }
                    className="w-full px-2 py-1 bg-prometheus-smoke/50 border border-prometheus-smoke rounded text-prometheus-fire-light text-sm mb-2"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) =>
                      handleItemChange(i, "description", e.target.value)
                    }
                    className="w-full px-2 py-1 bg-prometheus-smoke/50 border border-prometheus-smoke rounded text-prometheus-fire-light text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {section.type === "cta" && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2 text-prometheus-flame">
              Title
            </label>
            <input
              type="text"
              value={section.config.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/40 border border-slate-700 rounded-lg text-slate-200 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 focus:bg-slate-800/60 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-prometheus-flame">
              Button Text
            </label>
            <input
              type="text"
              value={section.config.buttonText}
              onChange={(e) => handleChange("buttonText", e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/40 border border-slate-700 rounded-lg text-slate-200 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 focus:bg-slate-800/60 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-prometheus-flame">
              Button Color
            </label>
            <input
              type="color"
              value={section.config.buttonColor}
              onChange={(e) => handleChange("buttonColor", e.target.value)}
              className="w-full h-10 rounded-lg cursor-pointer"
            />
          </div>
        </>
      )}

      {section.type === "text" && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2 text-prometheus-flame">
              Content
            </label>
            <textarea
              value={section.config.content}
              onChange={(e) => handleChange("content", e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/40 border border-slate-700 rounded-lg text-slate-200 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 focus:bg-slate-800/60 transition-all"
              rows={4}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-prometheus-flame">
              Font Size
            </label>
            <input
              type="number"
              value={section.config.fontSize}
              onChange={(e) => handleChange("fontSize", e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/40 border border-slate-700 rounded-lg text-slate-200 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 focus:bg-slate-800/60 transition-all"
            />
          </div>
        </>
      )}

      {section.type === "gallery" && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2 text-prometheus-flame">
              Title
            </label>
            <input
              type="text"
              value={section.config.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/40 border border-slate-700 rounded-lg text-slate-200 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 focus:bg-slate-800/60 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-prometheus-flame">
              Images
            </label>
            <div className="space-y-2">
              {section.config.images.map((img: string, i: number) => (
                <input
                  key={i}
                  type="text"
                  value={img}
                  onChange={(e) => handleImageChange(i, e.target.value)}
                  placeholder="Image URL"
                  className="w-full px-3 py-2 bg-prometheus-smoke/50 border border-prometheus-smoke rounded-lg text-prometheus-fire-light text-sm"
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
