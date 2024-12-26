import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Modal, Box, TextField, Button, MenuItem, Select, InputLabel, FormControl, Card, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Autocomplete } from '@mui/material';
import { getAllMunicipalitiesArea, getAreasByIsland } from "../../Data/obj/municipality";

// Define the Municipio type
interface Municipio {
  Id: string;
  Nombre: string;
  area_municipiosId: string;
}

const islands = [
  { label: 'Tenerife', value: '76ac0bec-4bc1-41a5-bc60-e528e0c12f4d' },
  { label: 'Gran Canaria', value: '6f91d60f-0996-4dde-9088-167aab83a21a' },
];

const MunicipiosTable: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Partial<Municipio> | null>(null);
  const [newRow, setNewRow] = useState<Partial<Municipio>>({});
  const [filterIsland, setFilterIsland] = useState<string>(islands[0].value); // Estado para la isla seleccionada
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>(""); // Estado para el término de búsqueda
  const [filteredMunicipios, setFilteredMunicipios] = useState<Municipio[]>([]); // Estado para los municipios filtrados

  // Fetch municipios
  const { data: municipios, isLoading } = useQuery({
    queryKey: ['municipios', selectedArea],
    queryFn: () => getAllMunicipalitiesArea(selectedArea),
    enabled: !!selectedArea,
  });

  // Fetch areas
  const { data: areas, isLoading: isLoadingAreas } = useQuery({
    queryKey: ['areas', filterIsland],
    queryFn: () => getAreasByIsland(filterIsland),
  });

  // Configurar área por defecto cuando las áreas estén disponibles
  useEffect(() => {
    if (areas && areas.length > 0 && !selectedArea) {
      setSelectedArea(areas[0].Id);
    }
  }, [areas, selectedArea]);

  // Filtrar municipios según el término de búsqueda
  useEffect(() => {
    if (municipios) {
      const filtered:any = municipios.filter((municipio: any) =>
        municipio.Nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMunicipios(filtered);
    }
  }, [municipios, searchTerm]);

  const updateMunicipio = useMutation({
    mutationFn: (updatedRow: any) =>
      axios.patch(`https://api.guachinchesmodernos.com:459/municipios/${updatedRow.Id}`, updatedRow),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['municipios'] });
      setIsModalOpen(false);
      setEditingRow(null);
    },
  });

  const deleteMunicipio = useMutation({
    mutationFn: (id: string) =>
      axios.delete(`https://api.guachinchesmodernos.com:459/municipios/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['municipios'] });
    },
  });

  const createMunicipio = useMutation({
    mutationFn: (newRow: any) =>
      axios.post('https://api.guachinchesmodernos.com:459/municipios', newRow),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['municipios'] });
      setNewRow({});
      setIsDialogOpen(false);
    },
  });

  const columns: GridColDef[] = [
    { field: 'Id', headerName: 'ID', width: 200 },
    { field: 'Nombre', headerName: 'Nombre', width: 200 },
    {
      field: 'actions',
      headerName: 'Acciones',
      flex:1,
      renderCell: (params) => (
        <div>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => {
              setEditingRow(params.row);
              setIsModalOpen(true);
            }}
            style={{ marginRight: '10px' }}
          >
            Editar
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => deleteMunicipio.mutate(params.row.Id)}
          >
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) return <p>Cargando municipios...</p>;
  if (isLoadingAreas) return <p>Cargando áreas...</p>;

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} spacing={6}>
        <Card>
          <Grid item xs={6}>
            <h2>Gestión de municipio</h2>
          </Grid>
          <Grid container alignItems="center" spacing={2} sx={{mt:6}}>
            <Grid item>
              <Autocomplete
                sx={{ width: 200, mr: 2 }}
                options={islands}
                getOptionLabel={(option) => option.label}
                renderInput={(params) => <TextField {...params} label="Filtrar por isla" />}
                value={islands.find((island) => island.value === filterIsland)}
                onChange={(event, newValue) => {
                  setFilterIsland(newValue?.value as string);
                  setSelectedArea(""); // Reiniciar el área seleccionada al cambiar de isla
                }}
                disableClearable
              />
            </Grid>
            <Grid item>
              <FormControl style={{ minWidth: 200 }}>
                <InputLabel>Filtrar por Área</InputLabel>
                <Select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                >
                  {areas.map((area: any) => (
                    <MenuItem key={area.Id} value={area.Id}>
                      {area.Nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item>
              <Autocomplete
                options={municipios as []}
                getOptionLabel={(option: Municipio) => option.Nombre}
                onInputChange={(event, newInputValue) => setSearchTerm(newInputValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Buscar Municipio" variant="outlined" fullWidth />
                )}
                style={{ width: 300 }}
              />
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setIsDialogOpen(true)}
              >
                Crear Municipio
              </Button>
            </Grid>
          </Grid>

            <DataGrid
              rows={filteredMunicipios || []}
              columns={columns}
              autoHeight
              getRowId={(row) => row.Id}
            />

          {/* Dialog para Crear Municipio */}
          <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
            <DialogTitle>Crear Nuevo Municipio</DialogTitle>
            <DialogContent>
              <TextField
                label="Nombre"
                value={newRow.Nombre || ''}
                onChange={(e) => setNewRow({ ...newRow, Nombre: e.target.value })}
                fullWidth
                style={{ marginBottom: '20px' }}
              />
              <FormControl fullWidth>
                <InputLabel>Área</InputLabel>
                <Select
                  value={newRow.area_municipiosId || ''}
                  onChange={(e) => setNewRow({ ...newRow, area_municipiosId: e.target.value })}
                >
                  {areas.map((area: any) => (
                    <MenuItem key={area.Id} value={area.Id}>
                      {area.Nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsDialogOpen(false)} color="secondary">
                Cancelar
              </Button>
              <Button
                onClick={() => createMunicipio.mutate(newRow)}
                color="primary"
                variant="contained"
              >
                Crear
              </Button>
            </DialogActions>
          </Dialog>
        </Card>
      </Grid>
    </Grid>
  );
};

export default MunicipiosTable;
