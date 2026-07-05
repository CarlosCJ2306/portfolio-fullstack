import { useEffect, useState } from "react";
import {
  clearStoredAdminCredentials,
  createAdminProject,
  createAdminCertification,
  createAdminEducation,
  createAdminExperience,
  createAdminSkill,
  createAdminSocialLink,
  deleteAdminCertification,
  deleteAdminEducation,
  deleteAdminExperience,
  getAdminContactMessages,
  getAdminDashboard,
  getAdminCertifications,
  getAdminEducation,
  getAdminExperience,
  getAdminProfile,
  getAdminProjects,
  getAdminSocialLinks,
  getAdminSkills,
  getStoredAdminCredentials,
  loginAdmin,
  deleteAdminProject,
  deleteAdminSkill,
  deleteAdminSocialLink,
  markAdminContactMessageAsRead,
  setStoredAdminCredentials,
  updateAdminCertification,
  updateAdminEducation,
  updateAdminExperience,
  updateAdminProject,
  updateAdminProfile,
  updateAdminSkill,
  updateAdminSocialLink,
  listMediaAssets,
} from "../services/adminApi";
import AdminAuthCard from "../components/admin/AdminAuthCard";
import AdminCertificationsPanel from "../components/admin/AdminCertificationsPanel";
import AdminEducationPanel from "../components/admin/AdminEducationPanel";
import AdminExperiencePanel from "../components/admin/AdminExperiencePanel";
import AdminMessagesPanel from "../components/admin/AdminMessagesPanel";
import AdminNotice from "../components/admin/AdminNotice";
import AdminProfilePanel from "../components/admin/AdminProfilePanel";
import AdminProjectsPanel from "../components/admin/AdminProjectsPanel";
import AdminSkillsPanel from "../components/admin/AdminSkillsPanel";
import AdminSocialLinksPanel from "../components/admin/AdminSocialLinksPanel";
import AdminStatsGrid from "../components/admin/AdminStatsGrid";
import AdminTopbar from "../components/admin/AdminTopbar";
import AdminToast from "../components/admin/AdminToast";
import "../styles/AdminLayout.css";

const initialLoginForm = {
  username: "",
  password: "",
};

const initialProfileForm = {
  full_name: "",
  professional_title: "",
  summary: "",
  location: "",
  email: "",
  phone: "",
  cv_url: "",
  avatar_asset_id: "",
};

const initialSkillForm = {
  name: "",
  category: "",
  level: "",
  color: "",
  icon_asset_id: "",
  display_order: 0,
  is_active: true,
};

const initialProjectForm = {
  title: "",
  slug: "",
  short_description: "",
  description: "",
  repository_url: "",
  demo_url: "",
  image_asset_id: "",
  gallery_image_ids: [],
  display_order: 0,
  is_featured: false,
  is_active: true,
  skill_ids: [],
};

const initialExperienceForm = {
  position: "",
  company: "",
  country: "",
  city: "",
  start_date: "",
  end_date: "",
  is_current: false,
  description: "",
  display_order: 0,
  is_active: true,
  bullets_text: "",
};

const initialEducationForm = {
  institution: "",
  degree: "",
  field_of_study: "",
  start_year: "",
  end_year: "",
  description: "",
  display_order: 0,
  is_active: true,
};

const initialCertificationForm = {
  name: "",
  issuer: "",
  issue_date: "",
  credential_url: "",
  description: "",
  display_order: 0,
  is_active: true,
  certificate_file_id: null,
};

const initialSocialLinkForm = {
  platform: "",
  url: "",
  icon_name: "",
  display_order: 0,
  is_active: true,
};

function normalizeProfileForm(profile) {
  const resolvedAvatarAssetId =
    profile?.avatar_asset_id ?? profile?.avatar?.id ?? "";

  return {
    full_name: profile?.full_name || "",
    professional_title: profile?.professional_title || "",
    summary: profile?.summary || "",
    location: profile?.location || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    cv_url: profile?.cv_url || "",
    avatar_asset_id: resolvedAvatarAssetId,
  };
}

function normalizeSocialLinkForm(socialLink) {
  return {
    platform: socialLink?.platform || "",
    url: socialLink?.url || "",
    icon_name: socialLink?.icon_name || "",
    display_order:
      socialLink?.display_order !== undefined && socialLink?.display_order !== null
        ? socialLink.display_order
        : 0,
    is_active: socialLink?.is_active !== undefined ? socialLink.is_active : true,
  };
}

function normalizeExperienceForm(experience) {
  return {
    position: experience?.position || "",
    company: experience?.company || "",
    country: experience?.country || "",
    city: experience?.city || "",
    start_date: experience?.start_date || "",
    end_date: experience?.end_date || "",
    is_current: experience?.is_current || false,
    description: experience?.description || "",
    display_order:
      experience?.display_order !== undefined && experience?.display_order !== null
        ? experience.display_order
        : 0,
    is_active: experience?.is_active !== undefined ? experience.is_active : true,
    bullets_text: Array.isArray(experience?.bullets)
      ? experience.bullets
          .map((bullet) => bullet?.description || bullet?.text || bullet)
          .filter(Boolean)
          .join("\n")
      : "",
  };
}

function normalizeEducationForm(education) {
  return {
    institution: education?.institution || "",
    degree: education?.degree || "",
    field_of_study: education?.field_of_study || "",
    start_year: education?.start_year || "",
    end_year: education?.end_year || "",
    description: education?.description || "",
    display_order:
      education?.display_order !== undefined && education?.display_order !== null
        ? education.display_order
        : 0,
    is_active: education?.is_active !== undefined ? education.is_active : true,
  };
}

function normalizeCertificationForm(certification) {
  return {
    name: certification?.name || "",
    issuer: certification?.issuer || "",
    issue_date: certification?.issue_date || "",
    credential_url: certification?.credential_url || "",
    description: certification?.description || "",
    display_order:
      certification?.display_order !== undefined && certification?.display_order !== null
        ? certification.display_order
        : 0,
    is_active: certification?.is_active !== undefined ? certification.is_active : true,
    certificate_file_id: certification?.certificate_file_id || null,
  };
}

function toNullableValue(value) {
  const trimmedValue = String(value ?? "").trim();

  return trimmedValue === "" ? null : trimmedValue;
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  try {
    return new Date(value).toLocaleString("es-CO", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function hasSavedAdminCredentials() {
  const storedCredentials = getStoredAdminCredentials();

  return Boolean(
    storedCredentials?.username && storedCredentials?.password
  );
}

export default function AdminPage() {
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [profileForm, setProfileForm] = useState(initialProfileForm);
  const [dashboard, setDashboard] = useState(null);
  const [contactMessages, setContactMessages] = useState([]);
  const [socialLinks, setSocialLinks] = useState([]);
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [educationList, setEducationList] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [mediaAssets, setMediaAssets] = useState([]);
  const [socialLinkForm, setSocialLinkForm] = useState(initialSocialLinkForm);
  const [skillForm, setSkillForm] = useState(initialSkillForm);
  const [projectForm, setProjectForm] = useState(initialProjectForm);
  const [experienceForm, setExperienceForm] = useState(initialExperienceForm);
  const [educationForm, setEducationForm] = useState(initialEducationForm);
  const [certificationForm, setCertificationForm] = useState(initialCertificationForm);
  const [editingSocialLinkId, setEditingSocialLinkId] = useState(null);
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingExperienceId, setEditingExperienceId] = useState(null);
  const [editingEducationId, setEditingEducationId] = useState(null);
  const [editingCertificationId, setEditingCertificationId] = useState(null);
  const [loading, setLoading] = useState(() => hasSavedAdminCredentials());
  const [authenticating, setAuthenticating] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSocialLink, setSavingSocialLink] = useState(false);
  const [savingSkill, setSavingSkill] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [savingExperience, setSavingExperience] = useState(false);
  const [savingEducation, setSavingEducation] = useState(false);
  const [savingCertification, setSavingCertification] = useState(false);
  const [refreshingMessages, setRefreshingMessages] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [notice, setNotice] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [shouldAutoLoadAdmin] = useState(() => hasSavedAdminCredentials());

  function showNotice(type, title, message = "") {
    setNotice({
      type,
      title,
      message,
      key: `${Date.now()}-${Math.random()}`,
    });
  }

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setNotice(null);
    }, 3200);

    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  function updateDashboardCounts(patch) {
    setDashboard((currentDashboard) => {
      if (!currentDashboard) {
        return currentDashboard;
      }

      return {
        ...currentDashboard,
        ...patch,
      };
    });
  }

  function replaceItemById(items, itemId, nextItem) {
    return items.map((item) => (item.id === itemId ? nextItem : item));
  }

  async function loadAdminData(options = {}) {
    const { showLoading = true } = options;

    try {
      if (showLoading) {
        setLoading(true);
      }
      setErrorMessage("");

      const [dashboardData, profileData, messagesData, socialLinksData] = await Promise.all([
        getAdminDashboard(),
        getAdminProfile(),
        getAdminContactMessages(),
        getAdminSocialLinks(),
      ]);

      const [skillsData, projectsData] = await Promise.all([
        getAdminSkills(),
        getAdminProjects(),
      ]);

      const [experienceData, educationData, certificationsData, mediaAssetsData] = await Promise.all([
        getAdminExperience(),
        getAdminEducation(),
        getAdminCertifications(),
        listMediaAssets(),
      ]);

      setDashboard(dashboardData);
      setProfileForm(normalizeProfileForm(profileData));
      setContactMessages(messagesData || []);
      setSocialLinks(socialLinksData || []);
      setSkills(skillsData || []);
      setProjects(projectsData || []);
      setExperiences(experienceData || []);
      setEducationList(educationData || []);
      setCertifications(certificationsData || []);
      setMediaAssets(mediaAssetsData || []);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Error cargando datos del admin:", error);
      setErrorMessage(error.message || "No se pudo cargar el panel admin.");
      clearStoredAdminCredentials();
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!shouldAutoLoadAdmin) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void loadAdminData({ showLoading: false });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [shouldAutoLoadAdmin]);

  function handleLoginChange(event) {
    const { name, value } = event.target;

    setLoginForm((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  function handleProfileChange(event) {
    const { name, value } = event.target;

    setProfileForm((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  function handleSocialLinkChange(event) {
    const { name, value, type, checked } = event.target;

    setSocialLinkForm((currentData) => ({
      ...currentData,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleSkillChange(event) {
    const { name, value, type, checked } = event.target;

    setSkillForm((currentData) => ({
      ...currentData,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleProjectChange(event) {
    const { name, value, type, checked } = event.target;

    setProjectForm((currentData) => ({
      ...currentData,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleProjectSkillToggle(skillId) {
    setProjectForm((currentData) => {
      const currentSkillIds = new Set(currentData.skill_ids);

      if (currentSkillIds.has(skillId)) {
        currentSkillIds.delete(skillId);
      } else {
        currentSkillIds.add(skillId);
      }

      return {
        ...currentData,
        skill_ids: Array.from(currentSkillIds),
      };
    });
  }

  function handleAssetUploaded(newAsset) {
    setMediaAssets((currentAssets) => [newAsset, ...currentAssets]);
  }

  function handleAvatarAssetChange(assetId) {
    setProfileForm((currentData) => ({
      ...currentData,
      avatar_asset_id: assetId,
    }));
  }

  function handleIconAssetChange(assetId) {
    setSkillForm((currentData) => ({
      ...currentData,
      icon_asset_id: assetId,
    }));
  }

  function handleImageAssetChange(assetId) {
    setProjectForm((currentData) => ({
      ...currentData,
      image_asset_id: assetId,
    }));
  }

  function handleProjectGalleryChange(galleryImageIds) {
    setProjectForm((currentData) => ({
      ...currentData,
      gallery_image_ids: Array.isArray(galleryImageIds) ? galleryImageIds : [],
    }));
  }

  function handlePdfAssetChange(assetId) {
    setCertificationForm((currentData) => ({
      ...currentData,
      certificate_file_id: assetId,
    }));
  }

  function resetSkillForm() {
    setSkillForm(initialSkillForm);
    setEditingSkillId(null);
  }

  function resetProjectForm() {
    setProjectForm(initialProjectForm);
    setEditingProjectId(null);
  }

  function resetExperienceForm() {
    setExperienceForm(initialExperienceForm);
    setEditingExperienceId(null);
  }

  function resetEducationForm() {
    setEducationForm(initialEducationForm);
    setEditingEducationId(null);
  }

  function resetCertificationForm() {
    setCertificationForm(initialCertificationForm);
    setEditingCertificationId(null);
  }

  function resetSocialLinkForm() {
    setSocialLinkForm(initialSocialLinkForm);
    setEditingSocialLinkId(null);
  }

  function toNumberOrNull(value) {
    if (value === "" || value === null || value === undefined) {
      return null;
    }

    const parsedValue = Number(value);

    return Number.isNaN(parsedValue) ? null : parsedValue;
  }

  function openSkillEditor(skill) {
    setEditingSkillId(skill.id);
    setSkillForm({
      name: skill.name || "",
      category: skill.category || "",
      level: skill.level || "",
      color: skill.color || "",
      icon_asset_id: skill.icon_asset_id || "",
      display_order: skill.display_order ?? 0,
      is_active: Boolean(skill.is_active),
    });
  }

  function openSocialLinkEditor(socialLink) {
    setEditingSocialLinkId(socialLink.id);
    setSocialLinkForm(normalizeSocialLinkForm(socialLink));
  }

  function openProjectEditor(project) {
    setEditingProjectId(project.id);
    setProjectForm({
      title: project.title || "",
      slug: project.slug || "",
      short_description: project.short_description || "",
      description: project.description || "",
      repository_url: project.repository_url || "",
      demo_url: project.demo_url || "",
      image_asset_id: project.image_asset_id || "",
      gallery_image_ids: Array.isArray(project.gallery_images)
        ? project.gallery_images
            .map((galleryItem) => galleryItem?.media_asset_id)
            .filter((assetId) => Number.isFinite(Number(assetId)))
            .map((assetId) => Number(assetId))
        : [],
      display_order: project.display_order ?? 0,
      is_featured: Boolean(project.is_featured),
      is_active: Boolean(project.is_active),
      skill_ids: (project.skills || []).map((skill) => skill.id),
    });
  }

  function openExperienceEditor(experience) {
    setEditingExperienceId(experience.id);
    setExperienceForm(normalizeExperienceForm(experience));
  }

  function openEducationEditor(education) {
    setEditingEducationId(education.id);
    setEducationForm(normalizeEducationForm(education));
  }

  function openCertificationEditor(certification) {
    setEditingCertificationId(certification.id);
    setCertificationForm(normalizeCertificationForm(certification));
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();

    setAuthenticating(true);
    setErrorMessage("");
    setSuccessMessage("");

    const credentials = {
      username: loginForm.username.trim(),
      password: loginForm.password,
    };

    try {
      const response = await loginAdmin(credentials);

      setStoredAdminCredentials(credentials);
      setSuccessMessage(response?.message || "Acceso administrativo autorizado.");
      showNotice("success", "Sesión iniciada", response?.message || "Acceso administrativo autorizado.");
      await loadAdminData();
    } catch (error) {
      console.error("Error autenticando admin:", error);
      setErrorMessage(error.message || "Credenciales inválidas.");
      showNotice("error", "No se pudo iniciar sesión", error.message || "Credenciales inválidas.");
    } finally {
      setAuthenticating(false);
    }
  }

  async function handleSocialLinkSubmit(event) {
    event.preventDefault();

    setSavingSocialLink(true);
    setErrorMessage("");
    setSuccessMessage("");

    const payload = {
      platform: socialLinkForm.platform.trim(),
      url: socialLinkForm.url.trim(),
      icon_name: toNullableValue(socialLinkForm.icon_name),
      display_order: Number(socialLinkForm.display_order || 0),
      is_active: Boolean(socialLinkForm.is_active),
    };

    try {
      if (editingSocialLinkId) {
        const updatedSocialLink = await updateAdminSocialLink(editingSocialLinkId, payload);
        setSocialLinks((currentItems) => replaceItemById(currentItems, editingSocialLinkId, updatedSocialLink));
        setSuccessMessage("Enlace social actualizado correctamente.");
        showNotice("success", "Enlace social guardado", "La tarjeta se actualizó sin recargar la vista.");
      } else {
        const createdSocialLink = await createAdminSocialLink(payload);
        setSocialLinks((currentItems) => [createdSocialLink, ...currentItems]);
        updateDashboardCounts({ total_social_links: (dashboard?.total_social_links || 0) + 1 });
        setSuccessMessage("Enlace social creado correctamente.");
        showNotice("success", "Enlace social creado", "Se agregó al listado al instante.");
      }

      resetSocialLinkForm();
    } catch (error) {
      console.error("Error guardando enlace social:", error);
      setErrorMessage(error.message || "No se pudo guardar el enlace social.");
      showNotice("error", "Error al guardar enlace social", error.message || "No se pudo guardar el enlace social.");
    } finally {
      setSavingSocialLink(false);
    }
  }

  async function handleDeleteSocialLink(socialLinkId) {
    if (!window.confirm("¿Eliminar este enlace social?")) {
      return;
    }

    try {
      setErrorMessage("");
      setSuccessMessage("");
      await deleteAdminSocialLink(socialLinkId);
      if (editingSocialLinkId === socialLinkId) {
        resetSocialLinkForm();
      }
      setSuccessMessage("Enlace social eliminado correctamente.");
      setSocialLinks((currentItems) => currentItems.filter((item) => item.id !== socialLinkId));
      updateDashboardCounts({ total_social_links: Math.max((dashboard?.total_social_links || 1) - 1, 0) });
      showNotice("success", "Enlace social eliminado", "La tarjeta desapareció sin recargar el panel.");
    } catch (error) {
      console.error("Error eliminando enlace social:", error);
      setErrorMessage(error.message || "No se pudo eliminar el enlace social.");
      showNotice("error", "Error al eliminar enlace social", error.message || "No se pudo eliminar el enlace social.");
    }
  }

  async function handleSkillSubmit(event) {
    event.preventDefault();

    setSavingSkill(true);
    setErrorMessage("");
    setSuccessMessage("");

    const payload = {
      name: skillForm.name.trim(),
      category: skillForm.category.trim(),
      level: skillForm.level.trim(),
      color: toNullableValue(skillForm.color),
      icon_asset_id: toNumberOrNull(skillForm.icon_asset_id),
      display_order: Number(skillForm.display_order || 0),
      is_active: Boolean(skillForm.is_active),
    };

    try {
      if (editingSkillId) {
        const updatedSkill = await updateAdminSkill(editingSkillId, payload);
        setSkills((currentItems) => replaceItemById(currentItems, editingSkillId, updatedSkill));
        setSuccessMessage("Skill actualizada correctamente.");
        showNotice("success", "Skill guardada", "La tarjeta se actualizó al instante.");
      } else {
        const createdSkill = await createAdminSkill(payload);
        setSkills((currentItems) => [createdSkill, ...currentItems]);
        updateDashboardCounts({ total_skills: (dashboard?.total_skills || 0) + 1 });
        setSuccessMessage("Skill creada correctamente.");
        showNotice("success", "Skill creada", "Se agregó al listado sin recargar la página.");
      }

      resetSkillForm();
    } catch (error) {
      console.error("Error guardando skill:", error);
      setErrorMessage(error.message || "No se pudo guardar la skill.");
      showNotice("error", "Error al guardar skill", error.message || "No se pudo guardar la skill.");
    } finally {
      setSavingSkill(false);
    }
  }

  async function handleDeleteSkill(skillId) {
    if (!window.confirm("¿Eliminar esta skill?")) {
      return;
    }

    try {
      setErrorMessage("");
      setSuccessMessage("");
      await deleteAdminSkill(skillId);
      if (editingSkillId === skillId) {
        resetSkillForm();
      }
      setSuccessMessage("Skill eliminada correctamente.");
      setSkills((currentItems) => currentItems.filter((item) => item.id !== skillId));
      updateDashboardCounts({ total_skills: Math.max((dashboard?.total_skills || 1) - 1, 0) });
      showNotice("success", "Skill eliminada", "La lista se actualizó sin recargar.");
    } catch (error) {
      console.error("Error eliminando skill:", error);
      setErrorMessage(error.message || "No se pudo eliminar la skill.");
      showNotice("error", "Error al eliminar skill", error.message || "No se pudo eliminar la skill.");
    }
  }

  async function handleProjectSubmit(event) {
    event.preventDefault();

    setSavingProject(true);
    setErrorMessage("");
    setSuccessMessage("");

    const payload = {
      title: projectForm.title.trim(),
      slug: projectForm.slug.trim(),
      short_description: projectForm.short_description.trim(),
      description: projectForm.description.trim(),
      repository_url: toNullableValue(projectForm.repository_url),
      demo_url: toNullableValue(projectForm.demo_url),
      image_asset_id: toNumberOrNull(projectForm.image_asset_id),
      display_order: Number(projectForm.display_order || 0),
      is_featured: Boolean(projectForm.is_featured),
      is_active: Boolean(projectForm.is_active),
      skill_ids: projectForm.skill_ids,
      gallery_image_ids: Array.isArray(projectForm.gallery_image_ids)
        ? projectForm.gallery_image_ids.map((assetId) => Number(assetId))
        : [],
    };

    try {
      if (editingProjectId) {
        const previousProject = projects.find((project) => project.id === editingProjectId);
        const updatedProject = await updateAdminProject(editingProjectId, payload);
        setProjects((currentItems) => replaceItemById(currentItems, editingProjectId, updatedProject));
        setSuccessMessage("Proyecto actualizado correctamente.");
        updateDashboardCounts({
          featured_projects:
            previousProject?.is_featured === updatedProject.is_featured
              ? dashboard?.featured_projects || 0
              : Math.max(
                  (dashboard?.featured_projects || 0) + (updatedProject.is_featured ? 1 : -1),
                  0
                ),
        });
        showNotice("success", "Proyecto guardado", "La tarjeta se actualizó al instante.");
      } else {
        const createdProject = await createAdminProject(payload);
        setProjects((currentItems) => [createdProject, ...currentItems]);
        updateDashboardCounts({
          total_projects: (dashboard?.total_projects || 0) + 1,
          featured_projects: payload.is_featured
            ? (dashboard?.featured_projects || 0) + 1
            : dashboard?.featured_projects || 0,
        });
        setSuccessMessage("Proyecto creado correctamente.");
        showNotice("success", "Proyecto creado", "Se agregó al listado sin recargar la página.");
      }

      resetProjectForm();
    } catch (error) {
      console.error("Error guardando proyecto:", error);
      setErrorMessage(error.message || "No se pudo guardar el proyecto.");
      showNotice("error", "Error al guardar proyecto", error.message || "No se pudo guardar el proyecto.");
    } finally {
      setSavingProject(false);
    }
  }

  function handleExperienceChange(event) {
    const { name, value, type, checked } = event.target;

    setExperienceForm((currentData) => ({
      ...currentData,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleEducationChange(event) {
    const { name, value, type, checked } = event.target;

    setEducationForm((currentData) => ({
      ...currentData,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleCertificationChange(event) {
    const { name, value, type, checked } = event.target;

    setCertificationForm((currentData) => ({
      ...currentData,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function parseBulletsText(bulletsText) {
    return String(bulletsText || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((description) => ({ description }));
  }

  async function handleExperienceSubmit(event) {
    event.preventDefault();

    setSavingExperience(true);
    setErrorMessage("");
    setSuccessMessage("");

    const payload = {
      position: experienceForm.position.trim(),
      company: experienceForm.company.trim(),
      country: toNullableValue(experienceForm.country),
      city: toNullableValue(experienceForm.city),
      start_date: experienceForm.start_date,
      end_date: experienceForm.is_current ? null : toNullableValue(experienceForm.end_date),
      is_current: Boolean(experienceForm.is_current),
      description: toNullableValue(experienceForm.description),
      display_order: Number(experienceForm.display_order || 0),
      is_active: Boolean(experienceForm.is_active),
      bullets: parseBulletsText(experienceForm.bullets_text),
    };

    try {
      if (editingExperienceId) {
        const updatedExperience = await updateAdminExperience(editingExperienceId, payload);
        setExperiences((currentItems) => replaceItemById(currentItems, editingExperienceId, updatedExperience));
        showNotice("success", "Experiencia guardada", "Los cambios se aplicaron sin recargar la página.");
        setSuccessMessage("Experiencia actualizada correctamente.");
      } else {
        const createdExperience = await createAdminExperience(payload);
        setExperiences((currentItems) => [createdExperience, ...currentItems]);
        updateDashboardCounts({ total_experience: (dashboard?.total_experience || 0) + 1 });
        showNotice("success", "Experiencia creada", "Se agregó al listado al instante.");
        setSuccessMessage("Experiencia creada correctamente.");
      }

      resetExperienceForm();
    } catch (error) {
      console.error("Error guardando experiencia:", error);
      setErrorMessage(error.message || "No se pudo guardar la experiencia.");
      showNotice("error", "Error al guardar experiencia", error.message || "No se pudo guardar la experiencia.");
    } finally {
      setSavingExperience(false);
    }
  }

  async function handleDeleteExperience(experienceId) {
    if (!window.confirm("¿Eliminar esta experiencia?")) {
      return;
    }

    try {
      setErrorMessage("");
      setSuccessMessage("");
      await deleteAdminExperience(experienceId);
      if (editingExperienceId === experienceId) {
        resetExperienceForm();
      }
      setExperiences((currentItems) => currentItems.filter((item) => item.id !== experienceId));
      updateDashboardCounts({ total_experience: Math.max((dashboard?.total_experience || 1) - 1, 0) });
      showNotice("success", "Experiencia eliminada", "El listado se actualizó sin recargar.");
    } catch (error) {
      console.error("Error eliminando experiencia:", error);
      setErrorMessage(error.message || "No se pudo eliminar la experiencia.");
      showNotice("error", "Error al eliminar experiencia", error.message || "No se pudo eliminar la experiencia.");
    }
  }

  async function handleEducationSubmit(event) {
    event.preventDefault();

    setSavingEducation(true);
    setErrorMessage("");
    setSuccessMessage("");

    const payload = {
      institution: educationForm.institution.trim(),
      degree: educationForm.degree.trim(),
      field_of_study: toNullableValue(educationForm.field_of_study),
      start_year: educationForm.start_year === "" ? null : Number(educationForm.start_year),
      end_year: educationForm.end_year === "" ? null : Number(educationForm.end_year),
      description: toNullableValue(educationForm.description),
      display_order: Number(educationForm.display_order || 0),
      is_active: Boolean(educationForm.is_active),
    };

    try {
      if (editingEducationId) {
        const updatedEducation = await updateAdminEducation(editingEducationId, payload);
        setEducationList((currentItems) => replaceItemById(currentItems, editingEducationId, updatedEducation));
        showNotice("success", "Educación guardada", "Los cambios se aplicaron sin recargar la página.");
        setSuccessMessage("Educación actualizada correctamente.");
      } else {
        const createdEducation = await createAdminEducation(payload);
        setEducationList((currentItems) => [createdEducation, ...currentItems]);
        updateDashboardCounts({ total_education: (dashboard?.total_education || 0) + 1 });
        showNotice("success", "Educación creada", "Se agregó al listado al instante.");
        setSuccessMessage("Educación creada correctamente.");
      }

      resetEducationForm();
    } catch (error) {
      console.error("Error guardando educación:", error);
      setErrorMessage(error.message || "No se pudo guardar la educación.");
      showNotice("error", "Error al guardar educación", error.message || "No se pudo guardar la educación.");
    } finally {
      setSavingEducation(false);
    }
  }

  async function handleDeleteEducation(educationId) {
    if (!window.confirm("¿Eliminar esta educación?")) {
      return;
    }

    try {
      setErrorMessage("");
      setSuccessMessage("");
      await deleteAdminEducation(educationId);
      if (editingEducationId === educationId) {
        resetEducationForm();
      }
      setEducationList((currentItems) => currentItems.filter((item) => item.id !== educationId));
      updateDashboardCounts({ total_education: Math.max((dashboard?.total_education || 1) - 1, 0) });
      showNotice("success", "Educación eliminada", "El listado se actualizó sin recargar.");
    } catch (error) {
      console.error("Error eliminando educación:", error);
      setErrorMessage(error.message || "No se pudo eliminar la educación.");
      showNotice("error", "Error al eliminar educación", error.message || "No se pudo eliminar la educación.");
    }
  }

  async function handleCertificationSubmit(event) {
    event.preventDefault();

    setSavingCertification(true);
    setErrorMessage("");
    setSuccessMessage("");

    const payload = {
      name: certificationForm.name.trim(),
      issuer: toNullableValue(certificationForm.issuer),
      issue_date: certificationForm.issue_date || null,
      credential_url: toNullableValue(certificationForm.credential_url),
      description: toNullableValue(certificationForm.description),
      display_order: Number(certificationForm.display_order || 0),
      is_active: Boolean(certificationForm.is_active),
      certificate_file_id: toNumberOrNull(certificationForm.certificate_file_id),
    };

    try {
      if (editingCertificationId) {
        const updatedCertification = await updateAdminCertification(editingCertificationId, payload);
        setCertifications((currentItems) => replaceItemById(currentItems, editingCertificationId, updatedCertification));
        showNotice("success", "Certificación guardada", "Los cambios se aplicaron sin recargar la página.");
        setSuccessMessage("Certificación actualizada correctamente.");
      } else {
        const createdCertification = await createAdminCertification(payload);
        setCertifications((currentItems) => [createdCertification, ...currentItems]);
        updateDashboardCounts({ total_certifications: (dashboard?.total_certifications || 0) + 1 });
        showNotice("success", "Certificación creada", "Se agregó al listado al instante.");
        setSuccessMessage("Certificación creada correctamente.");
      }

      resetCertificationForm();
    } catch (error) {
      console.error("Error guardando certificación:", error);
      setErrorMessage(error.message || "No se pudo guardar la certificación.");
      showNotice("error", "Error al guardar certificación", error.message || "No se pudo guardar la certificación.");
    } finally {
      setSavingCertification(false);
    }
  }

  async function handleDeleteCertification(certificationId) {
    if (!window.confirm("¿Eliminar esta certificación?")) {
      return;
    }

    try {
      setErrorMessage("");
      setSuccessMessage("");
      await deleteAdminCertification(certificationId);
      if (editingCertificationId === certificationId) {
        resetCertificationForm();
      }
      setCertifications((currentItems) => currentItems.filter((item) => item.id !== certificationId));
      updateDashboardCounts({ total_certifications: Math.max((dashboard?.total_certifications || 1) - 1, 0) });
      showNotice("success", "Certificación eliminada", "El listado se actualizó sin recargar.");
    } catch (error) {
      console.error("Error eliminando certificación:", error);
      setErrorMessage(error.message || "No se pudo eliminar la certificación.");
      showNotice("error", "Error al eliminar certificación", error.message || "No se pudo eliminar la certificación.");
    }
  }

  async function handleDeleteProject(projectId) {
    if (!window.confirm("¿Eliminar este proyecto?")) {
      return;
    }

    try {
      setErrorMessage("");
      setSuccessMessage("");
      await deleteAdminProject(projectId);
      if (editingProjectId === projectId) {
        resetProjectForm();
      }
      setSuccessMessage("Proyecto eliminado correctamente.");
      const removedProject = projects.find((project) => project.id === projectId);
      setProjects((currentItems) => currentItems.filter((item) => item.id !== projectId));
      updateDashboardCounts({
        total_projects: Math.max((dashboard?.total_projects || 1) - 1, 0),
        featured_projects:
          removedProject?.is_featured
            ? Math.max((dashboard?.featured_projects || 1) - 1, 0)
            : dashboard?.featured_projects || 0,
      });
      showNotice("success", "Proyecto eliminado", "La tarjeta salió sin refrescar toda la vista.");
    } catch (error) {
      console.error("Error eliminando proyecto:", error);
      setErrorMessage(error.message || "No se pudo eliminar el proyecto.");
      showNotice("error", "Error al eliminar proyecto", error.message || "No se pudo eliminar el proyecto.");
    }
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();

    setSavingProfile(true);
    setErrorMessage("");
    setSuccessMessage("");

    const payload = {
      full_name: profileForm.full_name.trim(),
      professional_title: profileForm.professional_title.trim(),
      summary: profileForm.summary.trim(),
      location: toNullableValue(profileForm.location),
      email: toNullableValue(profileForm.email),
      phone: toNullableValue(profileForm.phone),
      cv_url: toNullableValue(profileForm.cv_url),
      avatar_asset_id:
        profileForm.avatar_asset_id === ""
          ? null
          : Number(profileForm.avatar_asset_id),
    };

    try {
      const updatedProfile = await updateAdminProfile(payload);

      setProfileForm(normalizeProfileForm(updatedProfile));
      setSuccessMessage("Perfil actualizado correctamente.");
      showNotice("success", "Perfil guardado", "Los cambios se aplicaron sin recargar la interfaz.");
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      setErrorMessage(error.message || "No se pudo actualizar el perfil.");
      showNotice("error", "Error al actualizar perfil", error.message || "No se pudo actualizar el perfil.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleMarkAsRead(contactMessageId) {
    setRefreshingMessages(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const updatedMessage = await markAdminContactMessageAsRead(contactMessageId);
      setContactMessages((currentItems) => replaceItemById(currentItems, contactMessageId, updatedMessage));
      updateDashboardCounts({
        unread_contact_messages: Math.max((dashboard?.unread_contact_messages || 1) - 1, 0),
      });
      setSuccessMessage("Mensaje marcado como leído.");
      showNotice("success", "Mensaje leído", "La tarjeta cambió de estado sin recargar.");
    } catch (error) {
      console.error("Error actualizando mensaje de contacto:", error);
      setErrorMessage(
        error.message || "No se pudo actualizar el mensaje de contacto."
      );
      showNotice("error", "Error al actualizar mensaje", error.message || "No se pudo actualizar el mensaje de contacto.");
    } finally {
      setRefreshingMessages(false);
    }
  }

  function handleLogout() {
    clearStoredAdminCredentials();
    setLoginForm(initialLoginForm);
    setDashboard(null);
    setContactMessages([]);
    setSocialLinks([]);
    setSkills([]);
    setProjects([]);
    setExperiences([]);
    setEducationList([]);
    setCertifications([]);
    setSocialLinkForm(initialSocialLinkForm);
    setSkillForm(initialSkillForm);
    setProjectForm(initialProjectForm);
    setExperienceForm(initialExperienceForm);
    setEducationForm(initialEducationForm);
    setCertificationForm(initialCertificationForm);
    setProfileForm(initialProfileForm);
    setIsAuthenticated(false);
    setSuccessMessage("Sesión cerrada correctamente.");
    setNotice(null);
  }

  if (loading) {
    return (
      <main className="admin-shell">
        <section className="admin-card admin-loader">
          <span className="badge">Admin</span>
          <h1>Cargando panel administrativo...</h1>
          <p>Consultando la API protegida del backend.</p>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="admin-shell">
        <AdminAuthCard
          loginForm={loginForm}
          authenticating={authenticating}
          errorMessage={errorMessage}
          successMessage={successMessage}
          onLoginChange={handleLoginChange}
          onLoginSubmit={handleLoginSubmit}
        />
      </main>
    );
  }

  return (
    <main className="admin-shell admin-dashboard">
      <AdminToast notice={notice} />
      <AdminTopbar onLogout={handleLogout} />

      <AdminStatsGrid dashboard={dashboard} />

      <section className="admin-grid panel-grid">
        <AdminSocialLinksPanel
          socialLinks={socialLinks}
          socialLinkForm={socialLinkForm}
          savingSocialLink={savingSocialLink}
          editingSocialLinkId={editingSocialLinkId}
          onSocialLinkChange={handleSocialLinkChange}
          onSocialLinkSubmit={handleSocialLinkSubmit}
          onEditSocialLink={openSocialLinkEditor}
          onDeleteSocialLink={handleDeleteSocialLink}
          onCancelSocialLinkEdit={resetSocialLinkForm}
        />

        <AdminProfilePanel
          profileForm={profileForm}
          savingProfile={savingProfile}
          mediaAssets={mediaAssets}
          onProfileChange={handleProfileChange}
          onProfileSubmit={handleProfileSubmit}
          onAssetUploaded={handleAssetUploaded}
          onAvatarAssetChange={handleAvatarAssetChange}
        />

        <AdminMessagesPanel
          contactMessages={contactMessages}
          refreshingMessages={refreshingMessages}
          onMarkAsRead={handleMarkAsRead}
          formatDate={formatDate}
        />
      </section>

      <section className="admin-grid panel-grid">
        <AdminSkillsPanel
          skills={skills}
          skillForm={skillForm}
          savingSkill={savingSkill}
          editingSkillId={editingSkillId}
          mediaAssets={mediaAssets}
          onSkillChange={handleSkillChange}
          onSkillSubmit={handleSkillSubmit}
          onEditSkill={openSkillEditor}
          onDeleteSkill={handleDeleteSkill}
          onCancelSkillEdit={resetSkillForm}
          onAssetUploaded={handleAssetUploaded}
          onIconAssetChange={handleIconAssetChange}
        />

        <AdminProjectsPanel
          projects={projects}
          skills={skills}
          projectForm={projectForm}
          savingProject={savingProject}
          editingProjectId={editingProjectId}
          mediaAssets={mediaAssets}
          onProjectChange={handleProjectChange}
          onProjectSkillToggle={handleProjectSkillToggle}
          onProjectSubmit={handleProjectSubmit}
          onEditProject={openProjectEditor}
          onDeleteProject={handleDeleteProject}
          onCancelProjectEdit={resetProjectForm}
          onAssetUploaded={handleAssetUploaded}
          onImageAssetChange={handleImageAssetChange}
          onProjectGalleryChange={handleProjectGalleryChange}
        />
      </section>

      <section className="admin-grid content-grid">
        <AdminExperiencePanel
          experiences={experiences}
          experienceForm={experienceForm}
          savingExperience={savingExperience}
          editingExperienceId={editingExperienceId}
          onExperienceChange={handleExperienceChange}
          onExperienceSubmit={handleExperienceSubmit}
          onEditExperience={openExperienceEditor}
          onDeleteExperience={handleDeleteExperience}
          onCancelExperienceEdit={resetExperienceForm}
        />

        <AdminEducationPanel
          education={educationList}
          educationForm={educationForm}
          savingEducation={savingEducation}
          editingEducationId={editingEducationId}
          onEducationChange={handleEducationChange}
          onEducationSubmit={handleEducationSubmit}
          onEditEducation={openEducationEditor}
          onDeleteEducation={handleDeleteEducation}
          onCancelEducationEdit={resetEducationForm}
        />

        <AdminCertificationsPanel
          certifications={certifications}
          certificationForm={certificationForm}
          savingCertification={savingCertification}
          editingCertificationId={editingCertificationId}
          onCertificationChange={handleCertificationChange}
          onCertificationSubmit={handleCertificationSubmit}
          onEditCertification={openCertificationEditor}
          onDeleteCertification={handleDeleteCertification}
          onCancelCertificationEdit={resetCertificationForm}
          mediaAssets={mediaAssets}
          onAssetUploaded={handleAssetUploaded}
          onPdfAssetChange={handlePdfAssetChange}
        />
      </section>

      <AdminNotice />
    </main>
  );
}
