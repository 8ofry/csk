import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getGroup } from "@/application/groups/service";
import { requireRole } from "@/lib/auth-guard";
import { GroupForm } from "@/components/head-coach/group-form";
import { GroupRoster } from "@/components/head-coach/group-roster";
import { updateGroupAction } from "@/app/actions/groups";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listLocations } from "@/application/locations/service";
import { listDisciplines } from "@/application/disciplines/service";
import {
  listActiveCoaches,
  listActiveInterns,
  listActiveTrainees,
} from "@/application/users/directory";

export default async function EditGroupPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("HEAD_COACH");
  const { id } = await params;

  const [t, group, locations, disciplines, coaches, interns, trainees] = await Promise.all([
    getTranslations("hcGroupDetail"),
    getGroup(id),
    listLocations(),
    listDisciplines(),
    listActiveCoaches(),
    listActiveInterns(),
    listActiveTrainees(),
  ]);
  if (!group) notFound();

  const update = updateGroupAction.bind(null, id);
  const enrolledIds = new Set(group.enrollments.map((e) => e.traineeId));
  const availableTrainees = trainees.filter((tr) => !enrolledIds.has(tr.id));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{group.name}</h1>
        <p className="text-muted-foreground">
          {t("subtitle", {
            location: group.location.nameEn,
            discipline: group.discipline.nameEn,
            enrolled: group.enrollments.length,
            capacity: group.capacity,
          })}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("details")}</CardTitle>
        </CardHeader>
        <CardContent>
          <GroupForm
            defaultValues={{
              name: group.name,
              locationId: group.locationId,
              disciplineId: group.disciplineId,
              primaryCoachId: group.primaryCoachId,
              internId: group.internId,
              levelBand: group.levelBand,
              ageBandMin: group.ageBandMin,
              ageBandMax: group.ageBandMax,
              schedule: group.schedule as { days?: string[]; startTime?: string; endTime?: string },
              capacity: group.capacity,
              active: group.active,
            }}
            locations={locations.map((l) => ({ id: l.id, label: `${l.nameEn} (${l.district})` }))}
            disciplines={disciplines.map((d) => ({ id: d.id, label: `${d.nameEn} — ${d.category}` }))}
            coaches={coaches}
            interns={interns}
            onSubmit={update}
            submitLabel={t("saveChanges")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {t("rosterTitle", { enrolled: group.enrollments.length, capacity: group.capacity })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GroupRoster
            groupId={group.id}
            atCapacity={group.enrollments.length >= group.capacity}
            enrollments={group.enrollments.map((e) => ({
              id: e.id,
              traineeId: e.traineeId,
              fullNameEn: e.trainee.fullNameEn,
              fullNameAr: e.trainee.fullNameAr,
              startDate: e.startDate.toISOString(),
            }))}
            availableTrainees={availableTrainees}
          />
        </CardContent>
      </Card>
    </div>
  );
}
