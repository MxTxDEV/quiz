import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PageHeader, Table, Td, Th } from "@/components/ui/misc";
import { PasswordCard, PrivacyCard, UsersCard } from "@/components/admin/settings-panel";
import { getSetting } from "@/lib/services/settings";
import { listUsers, recentErrors } from "@/lib/services/users";
import { hasRole, requireUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const user = await requireUser();
  const isOwner = hasRole(user, "owner");
  const [privacy, users, errors] = await Promise.all([getSetting("privacy"), isOwner ? listUsers() : [], isOwner ? recentErrors() : []]);
  return (
    <>
      <PageHeader title="Configurações" />
      <div className="space-y-6">
        <PrivacyCard value={privacy} canEdit={isOwner} />
        {isOwner && <UsersCard users={users} meId={user.id} />}
        <PasswordCard />
        {isOwner && (
          <Card className="overflow-hidden">
            <CardHeader><CardTitle>Erros recentes</CardTitle></CardHeader>
            {errors.length ? (
              <Table>
                <thead><tr><Th>Quando</Th><Th>Origem</Th><Th>Mensagem</Th></tr></thead>
                <tbody>
                  {errors.map((e) => (
                    <tr key={e.id}>
                      <Td className="whitespace-nowrap text-muted-foreground">{formatDate(e.createdAt)}</Td>
                      <Td className="font-mono text-xs">{e.scope}</Td>
                      <Td className="text-[13px]">{e.message}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <CardContent><p className="text-[13px] text-muted-foreground">Nenhum erro registrado.</p></CardContent>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
