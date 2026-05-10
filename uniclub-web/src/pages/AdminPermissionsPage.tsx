import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getMatrix, listPermissions, setMatrix, type PermissionMatrix } from "../api/services/adminService";
import Button from "../components/common/Button";
import Card from "../components/common/Card";

const ROLES = ["member", "advisor", "board_member", "admin"] as const;

function AdminPermissionsPage() {
  const qc = useQueryClient();
  const { data: perms = [] } = useQuery({ queryKey: ["admin-permissions"], queryFn: listPermissions });
  const { data: serverMatrix } = useQuery({ queryKey: ["admin-matrix"], queryFn: getMatrix });

  const [draft, setDraft] = useState<PermissionMatrix>({});

  useEffect(() => {
    if (serverMatrix) {
      const cloned: PermissionMatrix = {};
      for (const r of ROLES) cloned[r] = [...(serverMatrix[r] ?? [])];
      setDraft(cloned);
    }
  }, [serverMatrix]);

  const saveMut = useMutation({
    mutationFn: () => setMatrix(draft),
    onSuccess: () => { toast.success("Saved."); qc.invalidateQueries({ queryKey: ["admin-matrix"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed."),
  });

  function toggle(role: string, code: string) {
    setDraft((prev) => {
      const set = new Set(prev[role] ?? []);
      if (set.has(code)) set.delete(code); else set.add(code);
      return { ...prev, [role]: Array.from(set) };
    });
  }

  function isDirty(): boolean {
    if (!serverMatrix) return false;
    for (const r of ROLES) {
      const a = new Set(serverMatrix[r] ?? []);
      const b = new Set(draft[r] ?? []);
      if (a.size !== b.size) return true;
      for (const x of a) if (!b.has(x)) return true;
    }
    return false;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="headline text-3xl font-bold text-ink">Role permissions</h1>
        <Button onClick={() => saveMut.mutate()} isLoading={saveMut.isPending} disabled={!isDirty()}>
          Save changes
        </Button>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate">
              <tr>
                <th className="py-2 pr-4">Permission</th>
                {ROLES.map((r) => (
                  <th key={r} className="px-2 text-center">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perms.map((p) => (
                <tr key={p.id} className="border-t border-slate/10">
                  <td className="py-2 pr-4">
                    <code className="text-xs">{p.code}</code>
                    <div className="text-xs text-slate">{p.description}</div>
                  </td>
                  {ROLES.map((r) => {
                    const checked = (draft[r] ?? []).includes(p.code);
                    const wasChecked = (serverMatrix?.[r] ?? []).includes(p.code);
                    const dirty = checked !== wasChecked;
                    return (
                      <td key={r} className={`px-2 text-center ${dirty ? "bg-yellow-50" : ""}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggle(r, p.code)} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default AdminPermissionsPage;
