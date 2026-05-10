import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { changeUserRole, listUsers, setUserActive } from "../api/services/adminService";
import Card from "../components/common/Card";
import type { UserRole } from "../types";

const ROLES: UserRole[] = ["member", "advisor", "board_member", "admin"];

function AdminUsersPage() {
  const qc = useQueryClient();
  const { data: users = [], isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: listUsers });

  const roleMut = useMutation({
    mutationFn: (vars: { id: number; role: UserRole; club_id: number | null }) =>
      changeUserRole(vars.id, vars.role, vars.club_id),
    onSuccess: () => { toast.success("Role updated."); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed."),
  });

  const activeMut = useMutation({
    mutationFn: (vars: { id: number; is_active: boolean }) => setUserActive(vars.id, vars.is_active),
    onSuccess: () => { toast.success("Updated."); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
  });

  if (isLoading) return <p className="text-slate">Loading...</p>;

  return (
    <div className="space-y-4">
      <h1 className="headline text-3xl font-bold text-ink">User management</h1>
      <Card>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-slate">
            <tr>
              <th className="py-2">Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Club</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate/10">
                <td className="py-2">{u.email}</td>
                <td>{u.full_name}</td>
                <td>
                  <select
                    className="rounded border border-slate/30 px-2 py-1"
                    value={u.role}
                    onChange={(e) =>
                      roleMut.mutate({ id: u.id, role: e.target.value as UserRole, club_id: u.club_id })
                    }
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </td>
                <td>{u.club_id ?? "-"}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={u.is_active}
                    onChange={(e) => activeMut.mutate({ id: u.id, is_active: e.target.checked })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export default AdminUsersPage;
