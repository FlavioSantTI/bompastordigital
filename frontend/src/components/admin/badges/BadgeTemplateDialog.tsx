/**
 * BadgeTemplateDialog.tsx
 * Modal interativo para personalização de molduras, presets visuais e layout dos crachás.
 * 
 * Estrutura:
 * 1. Escolha um Estilo de Moldura (Presets)
 * 2. Padrão de Exibição & Impressão (Card Unificado com Logo, Tag, QR, Guias de Corte, Paróquia, Diocese, Cidade)
 * 3. Ajustes Detalhados de Borda e Moldura
 * 4. Live Mini-Preview em tempo real
 */
import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Grid,
    Card,
    CardActionArea,
    FormControlLabel,
    Switch,
    Slider,
    RadioGroup,
    Radio,
    TextField,
    Chip,
    Divider,
    IconButton,
    Alert,
} from '@mui/material';
import {
    Palette,
    Close,
    RestartAlt,
    CheckCircle,
    Image as ImageIcon,
    QrCode2,
    AutoAwesome,
    Visibility,
    Straighten,
} from '@mui/icons-material';
import type { BadgeLayoutConfig, BadgeFramePreset, BadgeSizePreset } from '../../../types/badge';
import { BADGE_FRAME_PRESETS, BADGE_SIZE_PRESETS, DEFAULT_BADGE_LAYOUT } from '../../../types/badge';

interface BadgeTemplateDialogProps {
    open: boolean;
    onClose: () => void;
    currentLayout: BadgeLayoutConfig;
    onSaveLayout: (newLayout: BadgeLayoutConfig) => void;
}

export default function BadgeTemplateDialog({
    open,
    onClose,
    currentLayout,
    onSaveLayout,
}: BadgeTemplateDialogProps) {
    const [config, setConfig] = useState<BadgeLayoutConfig>(currentLayout);
    const [previewBgUrl, setPreviewBgUrl] = useState<string>(currentLayout.bg_image_url || '');

    useEffect(() => {
        setConfig(currentLayout);
        setPreviewBgUrl(currentLayout.bg_image_url || '');
    }, [currentLayout, open]);

    // Aplicar tamanho selecionado
    const handleSelectSizePreset = (sizeId: BadgeSizePreset) => {
        const sizeObj = BADGE_SIZE_PRESETS.find((s) => s.id === sizeId);
        if (!sizeObj) return;

        setConfig((prev) => ({
            ...prev,
            size_preset: sizeId,
            width_mm: sizeObj.width_mm,
            height_mm: sizeObj.height_mm,
            grid_columns: sizeObj.grid_columns,
            grid_rows: sizeObj.grid_rows,
        }));
    };

    // Aplicar preset selecionado preservando os padrões ativos
    const handleSelectPreset = (presetId: BadgeFramePreset) => {
        const presetObj = BADGE_FRAME_PRESETS.find((p) => p.id === presetId);
        if (!presetObj) return;

        setConfig((prev) => ({
            ...prev,
            frame_preset: presetId,
            border_width: presetObj.defaultBorderWidth,
            border_radius: presetObj.defaultBorderRadius,
            border_style: presetObj.defaultBorderStyle,
            border_color_mode: presetObj.defaultBorderColorMode,
            custom_border_color: presetObj.defaultCustomBorderColor || prev.custom_border_color || '#E0E0E0',
            layout_type: presetId === 'DESK_TENT' ? 'DESK_TENT' : 'GRID_A4',
        }));
    };

    // Upload de imagem de moldura customizada
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            setPreviewBgUrl(dataUrl);
            setConfig((prev) => ({ ...prev, bg_image_url: dataUrl, frame_preset: 'CUSTOM_BG' }));
        };
        reader.readAsDataURL(file);
    };

    const handleReset = () => {
        setConfig(DEFAULT_BADGE_LAYOUT);
        setPreviewBgUrl('');
    };

    const handleSave = () => {
        onSaveLayout({
            ...config,
            bg_image_url: previewBgUrl || undefined,
        });
        onClose();
    };

    // Cálculo visual para o mini preview
    const isGold = config.frame_preset === 'GOLD_CLASSIC';
    const isMinimal = config.frame_preset === 'MINIMAL';
    const isTent = config.frame_preset === 'DESK_TENT';
    const isSmall = config.width_mm <= 65 || config.size_preset === 'SMALL';
    const isMedium = (!isSmall && config.width_mm <= 95) || config.size_preset === 'MEDIUM';

    const previewWidth = isSmall ? 180 : (isMedium ? 210 : 230);
    const previewHeight = isSmall ? 285 : (isMedium ? 295 : 320);

    const previewBorderColor =
        isGold ? '#C5A059' :
        config.border_color_mode === 'ACCENT' ? '#0284C7' :
        (config.custom_border_color || '#E0E0E0');

    const previewFooterText = [
        config.show_parish !== false && 'Santuário Mãe Rainha',
        config.show_cidade !== false && 'Palmas - TO',
    ].filter(Boolean).join(' • ') || 'BOM PASTOR 2026';

    const currentSizeOption = BADGE_SIZE_PRESETS.find((s) => s.id === (config.size_preset || 'LARGE')) || BADGE_SIZE_PRESETS[2];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Palette color="primary" />
                    <Typography variant="h6" fontWeight="bold">
                        Personalizar Moldura, Tamanho & Layout do Crachá
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    {/* Coluna Esquerda: Presets e Configurações */}
                    <Grid item xs={12} md={7}>
                        {/* 1. Escolha o Tamanho do Crachá */}
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Straighten fontSize="small" color="primary" /> 1. Escolha o Tamanho do Crachá
                        </Typography>

                        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                            {BADGE_SIZE_PRESETS.map((sizeOpt) => {
                                const isSelected = (config.size_preset || 'LARGE') === sizeOpt.id;
                                return (
                                    <Grid item xs={12} sm={4} key={sizeOpt.id}>
                                        <Card
                                            variant="outlined"
                                            sx={{
                                                borderColor: isSelected ? 'primary.main' : 'divider',
                                                borderWidth: isSelected ? 2 : 1,
                                                bgcolor: isSelected ? 'action.selected' : 'background.paper',
                                                transition: 'all 0.2s',
                                                height: '100%',
                                            }}
                                        >
                                            <CardActionArea
                                                onClick={() => handleSelectSizePreset(sizeOpt.id)}
                                                sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start' }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', mb: 0.5 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                        <Typography variant="h6">{sizeOpt.icon}</Typography>
                                                        <Typography variant="body2" fontWeight="bold">
                                                            {sizeOpt.name}
                                                        </Typography>
                                                    </Box>
                                                    {isSelected && <CheckCircle color="primary" fontSize="small" />}
                                                </Box>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                                                    {sizeOpt.dimensions}
                                                </Typography>
                                                <Chip
                                                    label={`${sizeOpt.perPage} por folha A4`}
                                                    size="small"
                                                    color={isSelected ? 'primary' : 'default'}
                                                    variant={isSelected ? 'filled' : 'outlined'}
                                                    sx={{ fontSize: '0.65rem', height: 20, mt: 'auto' }}
                                                />
                                            </CardActionArea>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>

                        <Divider sx={{ my: 2.5 }} />

                        {/* 2. Galeria de Presets de Moldura */}
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AutoAwesome fontSize="small" color="primary" /> 2. Escolha um Estilo de Moldura
                        </Typography>

                        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                            {BADGE_FRAME_PRESETS.map((preset) => {
                                const isSelected = config.frame_preset === preset.id;
                                return (
                                    <Grid item xs={12} sm={6} key={preset.id}>
                                        <Card
                                            variant="outlined"
                                            sx={{
                                                borderColor: isSelected ? 'primary.main' : 'divider',
                                                borderWidth: isSelected ? 2 : 1,
                                                bgcolor: isSelected ? 'action.selected' : 'background.paper',
                                                transition: 'all 0.2s',
                                                height: '100%',
                                            }}
                                        >
                                            <CardActionArea
                                                onClick={() => handleSelectPreset(preset.id)}
                                                sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start' }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', mb: 0.5 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="h6">{preset.icon}</Typography>
                                                        <Typography variant="body2" fontWeight="bold">
                                                            {preset.name}
                                                        </Typography>
                                                    </Box>
                                                    {isSelected && <CheckCircle color="primary" fontSize="small" />}
                                                </Box>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                    {preset.subtitle}
                                                </Typography>
                                                <Chip
                                                    label={preset.recommendedFor}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.65rem', height: 20 }}
                                                />
                                            </CardActionArea>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>

                        <Divider sx={{ my: 2.5 }} />

                        {/* 3. CARD UNIFICADO: Padrão de Exibição & Impressão */}
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Visibility fontSize="small" color="primary" /> 3. Padrão de Exibição & Impressão
                        </Typography>

                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1.5,
                                p: 2,
                                border: '1px solid',
                                borderColor: 'primary.light',
                                borderRadius: 2,
                                bgcolor: 'action.hover',
                                mb: 3,
                            }}
                        >
                            {/* A. Elementos Gráficos e de Identificação */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="body2" fontWeight="bold">
                                        Logotipo Oficial no Cabeçalho
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Insere o brasão/logo oficial centralizado no topo do crachá
                                    </Typography>
                                </Box>
                                <Switch
                                    size="small"
                                    checked={config.show_header_logo !== false}
                                    onChange={(e) => setConfig((prev) => ({ ...prev, show_header_logo: e.target.checked }))}
                                />
                            </Box>
                            <Divider />

                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="body2" fontWeight="bold">
                                        Tag de Categoria (Encontrista, Equipe...)
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Destaca o papel temático do participante em chip com a cor da categoria
                                    </Typography>
                                </Box>
                                <Switch
                                    size="small"
                                    checked={config.show_category_chip !== false}
                                    onChange={(e) => setConfig((prev) => ({ ...prev, show_category_chip: e.target.checked }))}
                                />
                            </Box>
                            <Divider />

                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="body2" fontWeight="bold">
                                        QR Code de Presença/Check-in
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Gera o código dinâmico para leitura e confirmação rápida de presença
                                    </Typography>
                                </Box>
                                <Switch
                                    size="small"
                                    checked={config.has_qr_code !== false}
                                    onChange={(e) => setConfig((prev) => ({ ...prev, has_qr_code: e.target.checked }))}
                                />
                            </Box>
                            <Divider />

                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="body2" fontWeight="bold">
                                        Marcas de Corte Vetoriais (Guia de Refilamento)
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Insere marcas de corte nos 4 cantos para refilamento milimétrico
                                    </Typography>
                                </Box>
                                <Switch
                                    size="small"
                                    checked={config.has_cut_marks !== false}
                                    onChange={(e) => setConfig((prev) => ({ ...prev, has_cut_marks: e.target.checked }))}
                                />
                            </Box>
                            <Divider />

                            {/* Paróquia / Santuário */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="body2" fontWeight="bold">
                                        Paróquia / Santuário
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Exibe a paróquia do cadastro do participante
                                    </Typography>
                                </Box>
                                <Switch
                                    size="small"
                                    checked={config.show_parish !== false}
                                    onChange={(e) => setConfig((prev) => ({ ...prev, show_parish: e.target.checked }))}
                                />
                            </Box>
                            <Divider />

                            {/* Diocese / Arquidiocese */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="body2" fontWeight="bold">
                                        Diocese / Arquidiocese
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Exibe a diocese do cadastro do participante
                                    </Typography>
                                </Box>
                                <Switch
                                    size="small"
                                    checked={config.show_diocese !== false}
                                    onChange={(e) => setConfig((prev) => ({ ...prev, show_diocese: e.target.checked }))}
                                />
                            </Box>
                            <Divider />

                            {/* Cidade - UF */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="body2" fontWeight="bold">
                                        Cidade - UF
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Exibe a cidade/UF do cadastro do participante
                                    </Typography>
                                </Box>
                                <Switch
                                    size="small"
                                    checked={config.show_cidade !== false}
                                    onChange={(e) => setConfig((prev) => ({ ...prev, show_cidade: e.target.checked }))}
                                />
                            </Box>
                        </Box>

                        <Divider sx={{ my: 2.5 }} />

                        {/* 4. Ajustes Detalhados de Borda e Moldura */}
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
                            ⚙️ 4. Ajustes Detalhados de Borda e Moldura
                        </Typography>

                        {/* Espessura da Borda */}
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption" color="text.secondary">Espessura da Borda Externa</Typography>
                                <Typography variant="caption" fontWeight="bold">{config.border_width} pt</Typography>
                            </Box>
                            <Slider
                                size="small"
                                value={config.border_width}
                                min={0}
                                max={5}
                                step={0.5}
                                onChange={(_, val) => setConfig((prev) => ({ ...prev, border_width: val as number }))}
                                disabled={isMinimal}
                            />
                        </Box>

                        {/* Raio dos Cantos */}
                        <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption" color="text.secondary">Arredondamento dos Cantos</Typography>
                                <Typography variant="caption" fontWeight="bold">{config.border_radius} px</Typography>
                            </Box>
                            <Slider
                                size="small"
                                value={config.border_radius}
                                min={0}
                                max={16}
                                step={2}
                                onChange={(_, val) => setConfig((prev) => ({ ...prev, border_radius: val as number }))}
                                disabled={isMinimal || isTent}
                            />
                        </Box>

                        {/* Cor da Borda */}
                        {!isGold && !isMinimal && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                    Cor da Moldura
                                </Typography>
                                <RadioGroup
                                    row
                                    value={config.border_color_mode}
                                    onChange={(e) => setConfig((prev) => ({ ...prev, border_color_mode: e.target.value as any }))}
                                >
                                    <FormControlLabel
                                        value="CUSTOM"
                                        control={<Radio size="small" />}
                                        label={<Typography variant="caption">Cor Fixa Suave (#E0E0E0)</Typography>}
                                    />
                                    <FormControlLabel
                                        value="ACCENT"
                                        control={<Radio size="small" />}
                                        label={<Typography variant="caption">Cor Temática da Categoria</Typography>}
                                    />
                                </RadioGroup>
                            </Box>
                        )}

                        {/* Upload de Imagem de Fundo */}
                        {config.frame_preset === 'CUSTOM_BG' && (
                            <Box sx={{ mb: 2, p: 2, border: '1px dashed', borderColor: 'primary.main', borderRadius: 1.5, bgcolor: 'action.hover' }}>
                                <Typography variant="caption" fontWeight="bold" sx={{ display: 'block', mb: 1 }}>
                                    🖼️ Upload da Arte de Moldura (PNG/JPG)
                                </Typography>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    size="small"
                                    startIcon={<ImageIcon />}
                                    sx={{ mr: 1 }}
                                >
                                    Selecionar Imagem
                                    <input type="file" accept="image/png, image/jpeg" hidden onChange={handleImageUpload} />
                                </Button>
                                {previewBgUrl && (
                                    <Button
                                        size="small"
                                        color="error"
                                        onClick={() => {
                                            setPreviewBgUrl('');
                                            setConfig((prev) => ({ ...prev, bg_image_url: undefined }));
                                        }}
                                    >
                                        Remover
                                    </Button>
                                )}
                            </Box>
                        )}
                    </Grid>

                    {/* Coluna Direita: Live Mini-Preview Interativo */}
                    <Grid item xs={12} md={5} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mb: 1.5, textAlign: 'center' }}>
                            <Typography variant="subtitle2" fontWeight="bold">
                                👁️ Pré-visualização ao Vivo
                            </Typography>
                            <Chip
                                label={`${currentSizeOption.name} • ${currentSizeOption.dimensions} • ${currentSizeOption.perPage} por folha A4`}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ fontSize: '0.65rem', height: 20, mt: 0.5 }}
                            />
                        </Box>

                        {/* Mockup do Crachá Simulado */}
                        <Box
                            sx={{
                                width: previewWidth,
                                height: previewHeight,
                                bgcolor: '#FFFFFF',
                                borderRadius: `${config.border_radius}px`,
                                border: config.border_width > 0 ? `${config.border_width}px ${config.border_style} ${previewBorderColor}` : 'none',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                                boxShadow: 4,
                                backgroundImage: previewBgUrl ? `url(${previewBgUrl})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                transition: 'all 0.25s ease-in-out',
                            }}
                        >
                            {/* Friso Dourado Interno */}
                            {isGold && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        inset: 3,
                                        border: '1px solid #C5A059',
                                        borderRadius: `${Math.max(0, config.border_radius - 2)}px`,
                                        pointerEvents: 'none',
                                    }}
                                />
                            )}

                            {/* Tarja Superior */}
                            <Box sx={{ width: '100%', height: isMinimal ? 3 : 6, bgcolor: '#0284C7' }} />

                            {/* Cabeçalho */}
                            <Box sx={{ p: 0.8, textAlign: 'center', borderBottom: isMinimal ? 'none' : '1px solid #EEEEEE' }}>
                                {config.show_header_logo && (
                                    <Box
                                        component="img"
                                        src="/img/logo.jpg"
                                        sx={{ width: 28, height: 28, objectFit: 'contain', mx: 'auto', mb: 0.2 }}
                                    />
                                )}
                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 'bold', color: isGold ? '#1E293B' : '#1A237E' }}>
                                    BOM PASTOR 2026
                                </Typography>
                            </Box>

                            {/* Corpo */}
                            <Box sx={{ flex: 1, p: 0.8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                {config.show_category_chip && (
                                    <Chip
                                        label="ENCONTRISTA"
                                        size="small"
                                        sx={{
                                            fontSize: '0.55rem',
                                            height: 17,
                                            mb: 0.5,
                                            bgcolor: '#0284C718',
                                            color: '#0284C7',
                                            fontWeight: 'bold',
                                        }}
                                    />
                                )}

                                <Typography sx={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#212121', textAlign: 'center', lineHeight: 1.2 }}>
                                    Waltuir Nunes da Silva
                                </Typography>
                                <Typography sx={{ fontSize: '0.68rem', color: '#444444', fontStyle: 'italic', mb: 0.5 }}>
                                    da Adeniza
                                </Typography>

                                {isTent && (
                                    <Box sx={{ width: '80%', borderBottom: '1px dashed #9E9E9E', my: 0.5 }} />
                                )}

                                {config.has_qr_code && (
                                    <Box sx={{ p: 0.3, bgcolor: '#F5F5F5', borderRadius: 1, mb: 0.5 }}>
                                        <QrCode2 sx={{ fontSize: 28, color: '#333333' }} />
                                    </Box>
                                )}

                                {/* Informações Paroquiais Simuladas conforme Toggles */}
                                {(config.show_parish !== false || config.show_diocese !== false || config.show_cidade !== false) && (
                                    <Box sx={{ width: '100%', pt: 0.3, borderTop: '0.5px solid #EEEEEE' }}>
                                        {config.show_parish !== false && (
                                            <Typography sx={{ fontSize: '0.55rem', color: '#616161', lineHeight: 1.2 }}>
                                                <strong>PARÓQUIA:</strong> Santuário Mãe Rainha
                                            </Typography>
                                        )}
                                        {config.show_diocese !== false && (
                                            <Typography sx={{ fontSize: '0.55rem', color: '#616161', lineHeight: 1.2 }}>
                                                <strong>DIOCESE:</strong> Arquidiocese de Palmas
                                            </Typography>
                                        )}
                                        {config.show_cidade !== false && (
                                            <Typography sx={{ fontSize: '0.55rem', color: '#616161', lineHeight: 1.2 }}>
                                                <strong>CIDADE:</strong> Palmas - TO
                                            </Typography>
                                        )}
                                    </Box>
                                )}
                            </Box>

                            {/* Rodapé */}
                            <Box sx={{ p: 0.4, bgcolor: isGold ? '#F8F5EE' : '#0284C712', textAlign: 'center', borderTop: '1px solid #EEEEEE' }}>
                                <Typography sx={{ fontSize: '0.52rem', fontWeight: 'bold', color: isGold ? '#C5A059' : '#0284C7' }}>
                                    {previewFooterText}
                                </Typography>
                            </Box>
                        </Box>

                        <Alert severity="info" sx={{ mt: 2, fontSize: '0.75rem', py: 0.5 }}>
                            Ative ou desative as opções desejadas no card de Padrão de Exibição & Impressão.
                        </Alert>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
                <Button
                    startIcon={<RestartAlt />}
                    onClick={handleReset}
                    color="inherit"
                    size="small"
                >
                    Restaurar Padrão
                </Button>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button onClick={onClose} color="inherit">
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} variant="contained" color="primary">
                        Salvar e Aplicar
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
}
