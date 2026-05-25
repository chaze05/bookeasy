import { format } from "date-fns";
import { Building2, Globe } from "lucide-react";
import { getAllBusinesses } from "@/actions/superadmin";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BusinessActions } from "./business-actions";

export const metadata = { title: "Businesses — Superadmin" };

const STATUS_VARIANT: Record<
  string,
  "success" | "destructive" | "warning" | "outline"
> = {
  active: "success",
  suspended: "destructive",
  pending: "warning",
};

export default async function SuperadminBusinessesPage() {
  let businesses;
  try {
    businesses = await getAllBusinesses();
  } catch {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-sm text-red-400">Failed to load businesses.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Businesses</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {businesses.length} registered{" "}
            {businesses.length === 1 ? "business" : "businesses"}
          </p>
        </div>
      </div>

      {businesses.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800">
            <Building2 className="h-7 w-7 text-zinc-500" />
          </div>
          <p className="text-sm text-zinc-400">No businesses yet</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businesses.map((biz) => {
                const initials = biz.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <TableRow key={biz.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-violet-500/20 text-violet-400 text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-zinc-100">
                            {biz.name}
                          </p>
                          {biz.description && (
                            <p className="text-xs text-zinc-500 truncate max-w-48">
                              {biz.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-zinc-300">
                        {biz.owner?.full_name ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={STATUS_VARIANT[biz.status] ?? "outline"}
                      >
                        {biz.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-zinc-500">
                        <Globe className="h-3 w-3" />
                        {biz.slug}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500">
                      {format(new Date(biz.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <BusinessActions
                        businessId={biz.id}
                        status={biz.status}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
