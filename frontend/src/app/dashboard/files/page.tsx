"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Folder, File, ChevronRight, ArrowLeft, Plus, Trash2, Edit2, Save, X,
  FolderPlus, FilePlus, Home,
} from "lucide-react";
import { toast } from "sonner";

interface FileItem {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modified: string;
  permissions: string;
}

// Mock file system
const mockFiles: Record<string, FileItem[]> = {
  "/": [
    { name: "..", path: "/", is_dir: true, size: 0, modified: "2024-10-01 10:00:00", permissions: "0755" },
    { name: "wp-admin", path: "/wp-admin", is_dir: true, size: 0, modified: "2024-10-20 03:00:00", permissions: "0755" },
    { name: "wp-content", path: "/wp-content", is_dir: true, size: 0, modified: "2024-10-22 14:30:00", permissions: "0755" },
    { name: "wp-includes", path: "/wp-includes", is_dir: true, size: 0, modified: "2024-10-20 03:00:00", permissions: "0755" },
    { name: "index.php", path: "/index.php", is_dir: false, size: 405, modified: "2024-10-20 03:00:00", permissions: "0644" },
    { name: "wp-config.php", path: "/wp-config.php", is_dir: false, size: 3200, modified: "2024-10-20 03:05:00", permissions: "0640" },
    { name: ".htaccess", path: "/.htaccess", is_dir: false, size: 234, modified: "2024-10-20 03:00:00", permissions: "0644" },
    { name: "wp-login.php", path: "/wp-login.php", is_dir: false, size: 8400, modified: "2024-10-20 03:00:00", permissions: "0644" },
    { name: "robots.txt", path: "/robots.txt", is_dir: false, size: 68, modified: "2024-10-15 08:00:00", permissions: "0644" },
  ],
  "/wp-content": [
    { name: "..", path: "/", is_dir: true, size: 0, modified: "2024-10-01 10:00:00", permissions: "0755" },
    { name: "themes", path: "/wp-content/themes", is_dir: true, size: 0, modified: "2024-10-20 03:00:00", permissions: "0755" },
    { name: "plugins", path: "/wp-content/plugins", is_dir: true, size: 0, modified: "2024-10-22 10:00:00", permissions: "0755" },
    { name: "uploads", path: "/wp-content/uploads", is_dir: true, size: 0, modified: "2024-10-22 14:30:00", permissions: "0755" },
  ],
};

export default function FileManagerPage() {
  const queryClient = useQueryClient();
  const [currentPath, setCurrentPath] = useState("/");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileType, setNewFileType] = useState<"file" | "directory">("file");
  const domainId = 1; // Default domain in demo

  // Get files for current path
  const files = mockFiles[currentPath] || mockFiles["/"];

  const navigateTo = (path: string) => {
    if (path === "/..") {
      const parts = currentPath.split("/").filter(Boolean);
      parts.pop();
      setCurrentPath("/" + parts.join("/") || "/");
    } else {
      setCurrentPath(path);
    }
    setSelectedFile(null);
    setFileContent(null);
    setEditing(false);
  };

  const openFile = (file: FileItem) => {
    if (file.is_dir) {
      if (file.name === "..") {
        navigateTo("/..");
      } else {
        navigateTo(file.path);
      }
    } else {
      setSelectedFile(file);
      // Mock file content
      if (file.name === "index.php") {
        setFileContent("<?php\n/**\n * Front to the WordPress application.\n */\ndefine( 'WP_USE_THEMES', true );\nrequire __DIR__ . '/wp-blog-header.php';");
      } else if (file.name === ".htaccess") {
        setFileContent("# BEGIN WordPress\n<IfModule mod_rewrite.c>\nRewriteEngine On\nRewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]\nRewriteBase /\nRewriteRule ^index\\.php$ - [L]\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteRule . /index.php [L]\n</IfModule>\n# END WordPress");
      } else if (file.name === "robots.txt") {
        setFileContent("User-agent: *\nDisallow: /wp-admin/\nAllow: /wp-admin/admin-ajax.php");
      } else {
        setFileContent("// File content for: " + file.name);
      }
    }
  };

  const saveFile = () => {
    toast.success(`File saved: ${selectedFile?.name}`);
    setEditing(false);
  };

  const createItem = () => {
    if (!newFileName) return;
    toast.success(`${newFileType === "directory" ? "Folder" : "File"} created: ${newFileName}`);
    setShowNewFile(false);
    setNewFileName("");
  };

  const deleteItem = (file: FileItem) => {
    toast.success(`Deleted: ${file.name}`);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "—";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Breadcrumb parts
  const pathParts = currentPath.split("/").filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">File Manager</h1>
          <p className="mt-1 text-sm text-gray-500">Browse and edit files on your hosting.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setNewFileType("directory"); setShowNewFile(true); }}>
            <FolderPlus className="mr-1 h-3.5 w-3.5" /> New Folder
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setNewFileType("file"); setShowNewFile(true); }}>
            <FilePlus className="mr-1 h-3.5 w-3.5" /> New File
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm">
        <button onClick={() => navigateTo("/")} className="flex items-center gap-1 text-gray-500 hover:text-brand-600">
          <Home className="h-3.5 w-3.5" /> public_html
        </button>
        {pathParts.map((part, i) => (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 text-gray-400" />
            <button
              onClick={() => navigateTo("/" + pathParts.slice(0, i + 1).join("/"))}
              className="text-gray-500 hover:text-brand-600"
            >
              {part}
            </button>
          </span>
        ))}
      </div>

      {/* New file/folder form */}
      {showNewFile && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder={newFileType === "directory" ? "folder-name" : "filename.php"}
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="max-w-xs"
              />
              <Button size="sm" onClick={createItem}>Create {newFileType === "directory" ? "Folder" : "File"}</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowNewFile(false)}><X className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr,400px]">
        {/* File list */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Name</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Size</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Modified</th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Perms</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {files.filter(f => f.name !== "..").map((file) => (
                    <tr
                      key={file.name}
                      className={`hover:bg-gray-50 cursor-pointer ${selectedFile?.path === file.path ? "bg-brand-50" : ""}`}
                      onClick={() => openFile(file)}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {file.is_dir ? (
                            <Folder className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <File className="h-4 w-4 text-gray-400" />
                          )}
                          <span className={`font-medium ${file.is_dir ? "text-gray-900" : "text-gray-700"}`}>
                            {file.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500">{formatSize(file.size)}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{file.modified}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{file.permissions}</td>
                      <td className="px-4 py-2.5 text-right">
                        {!file.is_dir && (
                          <Button size="sm" variant="ghost" className="text-red-500" onClick={(e) => { e.stopPropagation(); deleteItem(file); }}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* File editor / preview */}
        {selectedFile && fileContent !== null && (
          <Card className="h-fit">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{selectedFile.name}</CardTitle>
                <div className="flex gap-1">
                  {editing ? (
                    <>
                      <Button size="sm" variant="ghost" onClick={saveFile}><Save className="h-3.5 w-3.5 text-green-600" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><X className="h-3.5 w-3.5" /></Button>
                    </>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => setEditing(true)}><Edit2 className="h-3.5 w-3.5" /></Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editing ? (
                <textarea
                  className="w-full h-64 rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-xs text-gray-900 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                />
              ) : (
                <pre className="w-full h-64 overflow-auto rounded-lg bg-gray-900 p-3 font-mono text-xs text-green-400">
                  {fileContent}
                </pre>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Size: {formatSize(selectedFile.size)} • Permissions: {selectedFile.permissions}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Back button */}
      {currentPath !== "/" && (
        <Button variant="ghost" size="sm" onClick={() => navigateTo("/..")}>
          <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back
        </Button>
      )}
    </div>
  );
}
